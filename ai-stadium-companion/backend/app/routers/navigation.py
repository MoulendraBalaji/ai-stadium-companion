import json
import logging

from fastapi import APIRouter

from app.ai_service import generate_text
from app.models.schemas import RouteRequest, RouteResponse, RouteStep
from app.services.crowd_engine import load_crowd_feed
from app.services.router_engine import (
    NodeNotFoundError,
    RouteNotFoundError,
    find_shortest_path,
    generate_steps,
    load_stadium_map,
)

logger = logging.getLogger("navigation_router")
router = APIRouter(prefix="/api/navigation", tags=["navigation"])


@router.post("/route", response_model=RouteResponse)
async def get_route(request: RouteRequest):
    """
    Computes a route from starting point to a destination.
    Uses AI intent parser to resolve destination_intent into actual node targets,
    then executes Dijkstra over the stadium graph.
    """
    stadium_map = load_stadium_map()
    crowd_data = load_crowd_feed()
    node_congestions = crowd_data.get("node_congestion", {})

    # Build node description list for the LLM
    nodes_summary = []
    for n in stadium_map.get("nodes", []):
        nodes_summary.append(
            {
                "id": n["id"],
                "name": n["name"],
                "type": n["type"],
                "accessible": n.get("accessible", True),
            }
        )

    # Prepare LLM query to extract intent
    nodes_json_str = json.dumps(nodes_summary, indent=2)
    system_instruction = (
        "You are a navigation intent parser for a FIFA World Cup stadium companion. "
        "Your task is to identify the user's desired destination from their query, "
        "and return a JSON block mapping to the nodes available in the stadium.\n"
        "Respond ONLY with a JSON object in the following format (no other text, no markdown block):\n"
        "{\n"
        '  "node_id": "exact_node_id_if_specified_otherwise_null",\n'
        '  "target_type": "restroom|food|gate|section|elevator|stairs|null",\n'
        '  "accessible": true|false|null\n'
        "}"
    )

    prompt = (
        f"Available Stadium Nodes:\n{nodes_json_str}\n\n"
        f"User query: '{request.destination_intent}'"
    )

    target_node_id = None
    target_type = None
    target_accessible = None

    try:
        llm_response = await generate_text(
            prompt, system_instruction=system_instruction
        )
        # Strip any potential markdown code blocks
        clean_response = llm_response.strip()
        if clean_response.startswith("```"):
            # strip start and end blocks
            lines = clean_response.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            clean_response = "\n".join(lines).strip()

        parsed = json.loads(clean_response)
        target_node_id = parsed.get("node_id")
        target_type = parsed.get("target_type")
        target_accessible = parsed.get("accessible")
    except Exception as e:
        logger.error(
            f"Error parsing LLM response or intent: {e}. Falling back to default heuristics."
        )
        # If LLM fails, we perform regex keyword heuristics
        query_lower = request.destination_intent.lower()
        if (
            "restroom" in query_lower
            or "toilet" in query_lower
            or "bathroom" in query_lower
        ):
            target_type = "restroom"
        elif (
            "food" in query_lower
            or "taco" in query_lower
            or "burger" in query_lower
            or "eat" in query_lower
        ):
            target_type = "food"
        elif "gate" in query_lower:
            target_type = "gate"
        elif "section" in query_lower:
            target_type = "section"

        if (
            "accessible" in query_lower
            or "wheelchair" in query_lower
            or "step-free" in query_lower
        ):
            target_accessible = True

    # Resolve target nodes based on LLM output
    possible_targets = []

    # 1. Check if LLM gave an exact, valid node_id
    all_node_ids = {n["id"] for n in stadium_map.get("nodes", [])}
    if target_node_id and target_node_id in all_node_ids:
        possible_targets.append(target_node_id)

    # 2. Otherwise search by type and accessibility constraints
    if not possible_targets and target_type:
        for n in stadium_map.get("nodes", []):
            if n["type"] == target_type:
                # If accessibility is required, filter nodes
                if target_accessible is True or request.accessible_only:
                    if n.get("accessible", True):
                        possible_targets.append(n["id"])
                else:
                    possible_targets.append(n["id"])

    # 3. If still nothing found, do a fuzzy substring name match on the query
    if not possible_targets:
        query_words = request.destination_intent.lower().split()
        for n in stadium_map.get("nodes", []):
            name_lower = n["name"].lower()
            if any(word in name_lower for word in query_words if len(word) > 2):
                possible_targets.append(n["id"])

    # If no destination candidates resolved, return safe "no route found" structure
    if not possible_targets:
        return RouteResponse(
            path=[],
            steps=[
                RouteStep(
                    instruction="Could not resolve destination. Please try another search term (e.g., 'restroom', 'section 114').",
                    distance_meters=0.0,
                    estimated_seconds=0.0,
                    accessible=False,
                )
            ],
            total_distance_meters=0.0,
            total_estimated_seconds=0.0,
            accessible_only=request.accessible_only,
            congestion_level="Low",
            destination_node_id="",
        )

    # Run Dijkstra towards all potential target nodes, pick the shortest
    best_path = None
    best_dist = float("inf")
    best_seconds = float("inf")
    best_target_id = None

    for target_id in possible_targets:
        try:
            path, dist, seconds = find_shortest_path(
                start_id=request.current_location,
                end_id=target_id,
                accessible_only=request.accessible_only,
                node_congestions=node_congestions,
                stadium_map=stadium_map,
            )
            if dist < best_dist:
                best_dist = dist
                best_seconds = seconds
                best_path = path
                best_target_id = target_id
        except (RouteNotFoundError, NodeNotFoundError):
            continue

    if not best_path:
        # Graceful no-route response instead of throwing a 500 error
        return RouteResponse(
            path=[],
            steps=[
                RouteStep(
                    instruction="No accessible route could be found to that location.",
                    distance_meters=0.0,
                    estimated_seconds=0.0,
                    accessible=False,
                )
            ],
            total_distance_meters=0.0,
            total_estimated_seconds=0.0,
            accessible_only=request.accessible_only,
            congestion_level="Low",
            destination_node_id="",
        )

    # Generate friendly text descriptions
    steps_data = generate_steps(best_path, stadium_map, node_congestions)
    steps = [RouteStep(**s) for s in steps_data]

    # Calculate average congestion level of path nodes
    avg_congestion = 0.0
    if len(best_path) > 0:
        avg_congestion = sum(node_congestions.get(nid, 0.0) for nid in best_path) / len(
            best_path
        )

    if avg_congestion < 0.4:
        congestion_level = "Low"
    elif avg_congestion < 0.75:
        congestion_level = "Medium"
    else:
        congestion_level = "High"

    return RouteResponse(
        path=best_path,
        steps=steps,
        total_distance_meters=best_dist,
        total_estimated_seconds=round(best_seconds, 1),
        accessible_only=request.accessible_only,
        congestion_level=congestion_level,
        destination_node_id=best_target_id,
    )

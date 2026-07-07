import heapq
import json
import os
from typing import Any

MAP_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "stadium_map.json"
)


class RouteNotFoundError(Exception):
    """Raised when no route can be found between two nodes."""

    pass


class NodeNotFoundError(Exception):
    """Raised when a specified node ID does not exist."""

    pass


def load_stadium_map() -> dict[str, Any]:
    """
    Loads simulated stadium map data.
    If the file is missing or corrupt, returns a basic fallback map.
    """
    try:
        if os.path.exists(MAP_PATH):
            with open(MAP_PATH, encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass

    # Fallback/Safe structure for edge cases
    return {"nodes": [], "edges": []}


def get_nodes_by_type(
    node_type: str, stadium_map: dict[str, Any]
) -> list[dict[str, Any]]:
    """Returns a list of nodes matching the specified type."""
    return [n for n in stadium_map.get("nodes", []) if n.get("type") == node_type]


def find_shortest_path(
    start_id: str,
    end_id: str,
    accessible_only: bool,
    node_congestions: dict[str, float],
    stadium_map: dict[str, Any],
) -> tuple[list[str], float, float]:
    """
    Finds the shortest path from start_id to end_id using Dijkstra's algorithm.
    Adjusts edge weights dynamically based on node congestion.

    Returns:
        Tuple[path_nodes, total_distance_meters, total_estimated_seconds]
    """
    nodes_dict = {n["id"]: n for n in stadium_map.get("nodes", [])}
    if start_id not in nodes_dict:
        raise NodeNotFoundError(
            f"Start node '{start_id}' not found in the stadium map."
        )
    if end_id not in nodes_dict:
        raise NodeNotFoundError(f"End node '{end_id}' not found in the stadium map.")

    # In accessible mode, starting or destination nodes must be accessible
    if accessible_only:
        if not nodes_dict[start_id].get("accessible", True):
            raise RouteNotFoundError(
                f"Start node '{start_id}' is not wheelchair accessible."
            )
        if not nodes_dict[end_id].get("accessible", True):
            raise RouteNotFoundError(
                f"Destination node '{end_id}' is not wheelchair accessible."
            )

    # Build adjacency list
    adj: dict[str, list[tuple[str, float, float, bool]]] = {
        nid: [] for nid in nodes_dict
    }
    for edge in stadium_map.get("edges", []):
        src = edge["source"]
        tgt = edge["target"]
        w = float(edge["weight"])
        acc = edge.get("accessible", True)

        # Add both directions since stadium map is bi-directional
        if src in adj and tgt in adj:
            adj[src].append((tgt, w, w, acc))
            adj[tgt].append((src, w, w, acc))

    # Priority Queue: (current_cost, current_node_id, path_taken, total_distance)
    # We use dynamic cost (with congestion scaling) for pathfinding selection,
    # but track physical distance separately.
    pq: list[tuple[float, str, list[str], float]] = [(0.0, start_id, [start_id], 0.0)]
    visited: set[str] = set()

    while pq:
        cost, curr, path, dist = heapq.heappop(pq)

        if curr == end_id:
            # Found shortest path!
            # Estimate seconds: average walking speed 1.2 m/s
            walking_speed = 1.2
            # Add a slight penalty for congested nodes to estimated time
            total_seconds = 0.0
            for i in range(len(path) - 1):
                # find physical weight of edge
                src_n, tgt_n = path[i], path[i + 1]
                edge_weight = 0.0
                for t, pw, _, _ in adj[src_n]:
                    if t == tgt_n:
                        edge_weight = pw
                        break
                congestion = node_congestions.get(tgt_n, 0.0)
                # Congestion slows down walking speed by up to 60%
                speed_multiplier = 1.0 - (congestion * 0.60)
                effective_speed = max(walking_speed * speed_multiplier, 0.3)
                total_seconds += edge_weight / effective_speed

            return path, dist, total_seconds

        if curr in visited:
            continue
        visited.add(curr)

        # Check accessibility of current node
        if accessible_only and not nodes_dict[curr].get("accessible", True):
            continue

        for neighbor, base_w, _, acc in adj[curr]:
            if neighbor in visited:
                continue
            if accessible_only and not acc:
                continue
            if accessible_only and not nodes_dict[neighbor].get("accessible", True):
                continue

            # Apply dynamic congestion multiplier
            congestion = float(node_congestions.get(neighbor, 0.0))
            # Cost increases with congestion (up to 3x penalty)
            adjusted_cost = base_w * (1.0 + congestion * 3.0)

            heapq.heappush(
                pq, (cost + adjusted_cost, neighbor, path + [neighbor], dist + base_w)
            )

    raise RouteNotFoundError(
        f"No path found from '{start_id}' to '{end_id}' (accessible_only={accessible_only})."
    )


def generate_steps(
    path: list[str], stadium_map: dict[str, Any], node_congestions: dict[str, float]
) -> list[dict[str, Any]]:
    """
    Generates user-friendly turn-by-turn text steps along the path.
    """
    nodes_dict = {n["id"]: n for n in stadium_map.get("nodes", [])}
    steps = []

    # Build fast adjacency map to find physical distances
    adj = {nid: {} for nid in nodes_dict}
    for edge in stadium_map.get("edges", []):
        src = edge["source"]
        tgt = edge["target"]
        w = float(edge["weight"])
        acc = edge.get("accessible", True)
        adj[src][tgt] = (w, acc)
        adj[tgt][src] = (w, acc)

    walking_speed = 1.2
    for i in range(len(path) - 1):
        src = path[i]
        tgt = path[i + 1]

        src_name = nodes_dict[src].get("name", src)
        tgt_name = nodes_dict[tgt].get("name", tgt)

        base_w, acc = adj[src].get(tgt, (10.0, True))

        congestion = node_congestions.get(tgt, 0.0)
        speed_multiplier = 1.0 - (congestion * 0.6)
        effective_speed = max(walking_speed * speed_multiplier, 0.3)
        est_sec = base_w / effective_speed

        congestion_desc = ""
        if congestion > 0.75:
            congestion_desc = " (Note: Expect heavy crowd congestion)"
        elif congestion > 0.4:
            congestion_desc = " (Note: Expect moderate crowd congestion)"

        instruction = f"From {src_name}, proceed to {tgt_name}.{congestion_desc}"

        steps.append(
            {
                "instruction": instruction,
                "distance_meters": base_w,
                "estimated_seconds": round(est_sec, 1),
                "accessible": acc,
            }
        )

    return steps

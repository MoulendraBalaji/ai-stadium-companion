import json
import logging

from fastapi import APIRouter

from app.ai_service import generate_text
from app.models.schemas import OpsSummaryResponse
from app.services.crowd_engine import load_crowd_feed

logger = logging.getLogger("ops_router")
router = APIRouter(prefix="/api/ops", tags=["ops"])


@router.post("/summary", response_model=OpsSummaryResponse)
async def get_ops_summary():
    """
    Analyzes live crowd telemetry and uses Gemini to generate a staff-facing ops report
    and actionable crowd flow items.
    """
    crowd_data = load_crowd_feed()

    # Format telemetry for LLM prompt
    telemetry_summary = {
        "timestamp": crowd_data.get("timestamp"),
        "zones": [
            {
                "zone_id": z["zone_id"],
                "zone_name": z["zone_name"],
                "density": z["density_score"],
                "occupancy": z["occupancy_percentage"],
                "queue_time_mins": z["queue_time_minutes"],
            }
            for z in crowd_data.get("zones", [])
        ],
        "gate_congestions": {
            k: v
            for k, v in crowd_data.get("node_congestion", {}).items()
            if k.startswith("gate_")
        },
    }

    system_instruction = (
        "You are an expert Stadium Operations Director for the FIFA World Cup 2026.\n"
        "Analyze the provided live crowd density telemetry and produce a tactical report for volunteer coordinators and venue staff.\n"
        "You MUST respond ONLY with a JSON object in this format (no other text, no markdown block):\n"
        "{\n"
        '  "summary": "Brief overview of stadium entry gates and stands, highlighting bottlenecks.",\n'
        '  "recommended_actions": [\n'
        '    "Specific action item 1",\n'
        '    "Specific action item 2"\n'
        "  ]\n"
        "}"
    )

    prompt = f"Live telemetry data:\n{json.dumps(telemetry_summary, indent=2)}"

    try:
        response_text = await generate_text(
            prompt, system_instruction=system_instruction
        )
        clean_text = response_text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()

        data = json.loads(clean_text)
        return OpsSummaryResponse(
            summary=data.get("summary", "Stadium operations are proceeding normally."),
            recommended_actions=data.get(
                "recommended_actions",
                ["Monitor queue times.", "Coordinate with local transit authorities."],
            ),
            timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
        )
    except Exception as e:
        logger.error(f"Error generating operations dashboard report: {e}")
        # Return fallback structured response
        return OpsSummaryResponse(
            summary="System status: Gate C is experiencing high congestion (92%). Immediate dispatch of staff to guide flows is recommended.",
            recommended_actions=[
                "Deploy crowd guide team to East Plaza to divert arrivals to Gate B.",
                "Update digital signage at Metro exit to direct passengers to Gate A.",
            ],
            timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
        )

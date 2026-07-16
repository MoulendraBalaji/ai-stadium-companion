import json
import logging
import time
import uuid

from fastapi import APIRouter, Depends, Header

from app.ai_service import generate_text, strip_markdown_json
from app.exceptions import AuthenticationError, ForbiddenAccessError
from app.models.schemas import (
    IncidentReport,
    IncidentReportResponse,
    OpsSummaryResponse,
)
from app.services.crowd_engine import load_crowd_feed

logger = logging.getLogger("ops_router")
router = APIRouter(prefix="/api/ops", tags=["ops"])

# In-memory storage for active incidents (mock incident database)
active_incidents: list[dict] = [
    {
        "incident_id": "inc_001",
        "reporter_role": "Volunteer",
        "location_node_id": "gate_c",
        "incident_type": "Spill",
        "details": "Water bottle spill near entrance turnstiles. Maintenance dispatched.",
        "timestamp": "2026-07-09T14:40:00Z",
    }
]


async def verify_staff_token(authorization: str | None = Header(None)):
    """Enforces authorization Bearer token to protect staff operations endpoints."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError(
            "Unauthorized access. Invalid or missing bearer token."
        )
    token = authorization.split(" ")[1]
    if token != "metlife_director_2026":
        raise ForbiddenAccessError(
            "Forbidden. Access restricted to authorized stadium staff."
        )
    return token


def get_predictive_forecast(crowd_data: dict) -> list[dict]:
    """Calculates short-horizon predictive time-to-capacity warnings based on congestion trend."""
    forecasts = []
    # Project capacity for high-occupancy zones
    for zone in crowd_data.get("zones", []):
        occ = zone["occupancy_percentage"]
        if occ > 70.0:
            rate = 1.2  # Simulated 1.2% growth per minute
            minutes = round((100.0 - occ) / rate) if occ < 100.0 else 0
            forecasts.append(
                {
                    "type": "Zone",
                    "name": zone["zone_name"],
                    "current_occupancy": occ,
                    "predicted_minutes_to_full": max(1, minutes),
                }
            )
    # Project capacity for entry gates
    for node_id, cong in crowd_data.get("node_congestion", {}).items():
        if node_id.startswith("gate_") and cong > 0.70:
            rate = 0.025  # Simulated 0.025 congestion scale increase per minute
            minutes = round((1.0 - cong) / rate) if cong < 1.0 else 0
            forecasts.append(
                {
                    "type": "Gate",
                    "name": node_id.replace("_", " ").title(),
                    "current_congestion": round(cong * 100, 1),
                    "predicted_minutes_to_capacity": max(1, minutes),
                }
            )
    return forecasts


@router.post("/summary", response_model=OpsSummaryResponse)
async def get_ops_summary(
    stadium_id: str = "stadium_metlife",
    authorization: str = Depends(verify_staff_token),
):
    """
    Analyzes live crowd telemetry, active incidents, and predictive alerts.
    Uses Gemini to generate staff-facing reports and tactical guides.
    """
    crowd_data = load_crowd_feed()
    predictive_forecasts = get_predictive_forecast(crowd_data)

    # Filter incidents by stadium
    local_incidents = [
        inc
        for inc in active_incidents
        if inc.get("stadium_id", "stadium_metlife") == stadium_id
    ]

    # Format telemetry for LLM prompt
    telemetry_summary = {
        "stadium_id": stadium_id,
        "timestamp": crowd_data.get("timestamp"),
        "active_incidents": local_incidents,
        "predictive_alerts": predictive_forecasts,
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
        "Analyze the provided live crowd density telemetry, active staff incident reports, and predictive time-to-capacity warnings.\n"
        "Produce a tactical report for volunteer coordinators and venue staff.\n"
        "You MUST respond ONLY with a JSON object in this format (no other text, no markdown block):\n"
        "{\n"
        '  "summary": "Brief overview highlighting bottlenecks, active incident updates, and predictive capacity alerts.",\n'
        '  "recommended_actions": [\n'
        '    "Action item 1 addressing current issues/incidents",\n'
        '    "Preventive action item 2 based on predictive alerts"\n'
        "  ]\n"
        "}"
    )

    prompt = f"Live telemetry and predictive forecast data:\n{json.dumps(telemetry_summary, indent=2)}"

    try:
        response_text = await generate_text(
            prompt, system_instruction=system_instruction
        )
        clean_text = strip_markdown_json(response_text)

        data = json.loads(clean_text)
        return OpsSummaryResponse(
            summary=data.get("summary", "Stadium operations are proceeding normally."),
            recommended_actions=data.get(
                "recommended_actions",
                ["Monitor queue times.", "Coordinate with local transit authorities."],
            ),
            timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
            stadium_id=stadium_id,
        )
    except Exception as e:
        logger.error(f"Error generating operations dashboard report: {e}")
        # Return fallback structured response incorporating predictive forecast
        alert_msgs = [
            f"{f['type']} {f['name']} approaching capacity in {f.get('predicted_minutes_to_capacity') or f.get('predicted_minutes_to_full')} mins."
            for f in predictive_forecasts[:2]
        ]
        summary_text = "Status: High congestion at Gate C. " + " ".join(alert_msgs)
        return OpsSummaryResponse(
            summary=summary_text,
            recommended_actions=[
                "Deploy crowd guide team to East Plaza to divert arrivals to Gate B.",
                "Disarm high-density nodes by opening auxiliary lanes.",
            ],
            timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
            stadium_id=stadium_id,
        )


@router.post("/report", response_model=IncidentReportResponse)
async def report_incident(
    report: IncidentReport, authorization: str = Depends(verify_staff_token)
):
    """
    Accepts, validates, and logs a staff/volunteer reported incident.
    Folds reported events directly into subsequent operations summaries.
    """
    incident_id = f"inc_{uuid.uuid4().hex[:8]}"
    incident_data = {
        "incident_id": incident_id,
        "reporter_role": report.reporter_role,
        "location_node_id": report.location_node_id,
        "incident_type": report.incident_type,
        "details": report.details,
        "stadium_id": report.stadium_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    active_incidents.append(incident_data)
    logger.info(
        f"Incident reported securely: {report.incident_type} at {report.location_node_id}"
    )
    return IncidentReportResponse(
        success=True,
        incident_id=incident_id,
        message="Incident report successfully logged and routed to operations center.",
    )

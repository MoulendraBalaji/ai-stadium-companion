from fastapi import APIRouter

from app.models.schemas import CrowdStatusResponse, CrowdZoneStatus
from app.services.crowd_engine import get_congestion_level_from_score, load_crowd_feed

router = APIRouter(prefix="/api/crowd", tags=["crowd"])

CROWD_TIPS: dict[str, str] = {
    "Critical": "Critical density detected. Deploy crowd control staff and activate overflow routing immediately.",
    "Crowded": "Zone approaching capacity. Consider proactive rerouting of incoming fans to adjacent gates.",
    "Normal": "Zone operating within normal parameters. Maintain current staffing levels.",
}


def generate_crowd_tips(zones: list[CrowdZoneStatus]) -> list[str]:
    """Generates actionable crowd management tips based on zone statuses."""
    tips: list[str] = []
    critical_zones = [z for z in zones if z.status == "Critical"]
    crowded_zones = [z for z in zones if z.status == "Crowded"]

    if critical_zones:
        names = ", ".join(z.zone_name for z in critical_zones)
        tips.append(
            f"ALERT: {names} at critical density. Dispatch additional staff and open overflow entry points."
        )
    if crowded_zones:
        names = ", ".join(z.zone_name for z in crowded_zones)
        tips.append(
            f"Advisory: {names} are crowded. Redirect fans via announcements to less congested zones."
        )

    longest_wait = max(zones, key=lambda z: z.queue_time_minutes)
    if longest_wait.queue_time_minutes > 15:
        tips.append(
            f"Longest queue at {longest_wait.zone_name} ({longest_wait.queue_time_minutes}min). "
            "Open additional service lanes or deploy mobile staff to speed throughput."
        )

    if not tips:
        tips.append("All zones operating normally. Continue monitoring for changes.")

    return tips


@router.get("/status", response_model=CrowdStatusResponse)
async def get_crowd_status(stadium_id: str = "stadium_metlife"):
    """
    Returns live crowd density levels, congestion rates per zone,
    and actionable crowd management recommendations for venue staff.
    """
    crowd_data = load_crowd_feed()
    zones = []

    for z in crowd_data.get("zones", []):
        density = float(z.get("density_score", 0.0))
        status = get_congestion_level_from_score(density)

        # Override with "Critical" if density is extremely high
        if density >= 0.90:
            status = "Critical"

        zones.append(
            CrowdZoneStatus(
                zone_id=z["zone_id"],
                zone_name=z["zone_name"],
                density_score=density,
                occupancy_percentage=float(z.get("occupancy_percentage", 0.0)),
                queue_time_minutes=int(z.get("queue_time_minutes", 0)),
                status=status,
            )
        )

    tips = generate_crowd_tips(zones)

    return CrowdStatusResponse(
        zones=zones,
        timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
        stadium_id=stadium_id,
        crowd_management_tips=tips,
    )

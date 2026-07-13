from fastapi import APIRouter

from app.models.schemas import CrowdStatusResponse, CrowdZoneStatus
from app.services.crowd_engine import get_congestion_level_from_score, load_crowd_feed

router = APIRouter(prefix="/api/crowd", tags=["crowd"])


@router.get("/status", response_model=CrowdStatusResponse)
async def get_crowd_status(stadium_id: str = "stadium_metlife"):
    """
    Returns live crowd density levels and congestion rates per zone.
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

    return CrowdStatusResponse(
        zones=zones,
        timestamp=crowd_data.get("timestamp", "2026-07-07T20:30:56Z"),
        stadium_id=stadium_id,
    )

import json
import os
from typing import Any

CROWD_FEED_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "crowd_feed.json"
)


def load_crowd_feed() -> dict[str, Any]:
    """
    Loads simulated crowd feed data from crowd_feed.json.
    In case of missing or corrupt file, returns a default empty/safeguard structure.
    """
    try:
        if os.path.exists(CROWD_FEED_PATH):
            with open(CROWD_FEED_PATH, encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass

    # Fallback/Safe structure for edge cases
    return {
        "timestamp": "2026-07-07T20:30:56Z",
        "zones": [
            {
                "zone_id": "North",
                "zone_name": "North Stands",
                "density_score": 0.0,
                "occupancy_percentage": 0.0,
                "queue_time_minutes": 0,
            },
            {
                "zone_id": "South",
                "zone_name": "South Stands",
                "density_score": 0.0,
                "occupancy_percentage": 0.0,
                "queue_time_minutes": 0,
            },
            {
                "zone_id": "East",
                "zone_name": "East Stands",
                "density_score": 0.0,
                "occupancy_percentage": 0.0,
                "queue_time_minutes": 0,
            },
            {
                "zone_id": "West",
                "zone_name": "West Stands",
                "density_score": 0.0,
                "occupancy_percentage": 0.0,
                "queue_time_minutes": 0,
            },
        ],
        "node_congestion": {},
    }


def get_node_congestion_multiplier(node_id: str, crowd_data: dict[str, Any]) -> float:
    """
    Returns a congestion multiplier for a specific node (from 0.0 to 1.0).
    Default is 0.0 if node is not found in the feed.
    """
    congestions = crowd_data.get("node_congestion", {})
    return float(congestions.get(node_id, 0.0))


def get_zone_congestion_level(zone_id: str, crowd_data: dict[str, Any]) -> str:
    """
    Classifies a zone's congestion level based on density score.
    """
    for zone in crowd_data.get("zones", []):
        if zone.get("zone_id") == zone_id:
            density = zone.get("density_score", 0.0)
            if density < 0.4:
                return "Low"
            elif density < 0.75:
                return "Medium"
            else:
                return "High"
    return "Low"


def get_congestion_level_from_score(score: float) -> str:
    if score < 0.4:
        return "Low"
    elif score < 0.75:
        return "Medium"
    return "High"

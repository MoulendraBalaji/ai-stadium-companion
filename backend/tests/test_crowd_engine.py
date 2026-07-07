from app.services.crowd_engine import (
    get_congestion_level_from_score,
    get_node_congestion_multiplier,
    get_zone_congestion_level,
    load_crowd_feed,
)


def test_load_crowd_feed():
    feed = load_crowd_feed()
    assert "zones" in feed
    assert "node_congestion" in feed
    assert len(feed["zones"]) == 4


def test_node_congestion_multiplier():
    feed = load_crowd_feed()
    # Check gate_c which is simulated high congestion (0.95)
    mult = get_node_congestion_multiplier("gate_c", feed)
    assert mult == 0.95

    # Check invalid node fallback
    mult_invalid = get_node_congestion_multiplier("non_existent_node", feed)
    assert mult_invalid == 0.0


def test_zone_congestion_levels():
    feed = load_crowd_feed()
    # East stands are at 0.92 density -> "High"
    level_east = get_zone_congestion_level("East", feed)
    assert level_east == "High"

    # North stands are at 0.35 density -> "Low"
    level_north = get_zone_congestion_level("North", feed)
    assert level_north == "Low"


def test_congestion_level_from_score():
    assert get_congestion_level_from_score(0.2) == "Low"
    assert get_congestion_level_from_score(0.55) == "Medium"
    assert get_congestion_level_from_score(0.85) == "High"

import pytest

from app.services.router_engine import (
    NodeNotFoundError,
    RouteNotFoundError,
    find_shortest_path,
    generate_steps,
    load_stadium_map,
)


def test_load_stadium_map():
    stadium_map = load_stadium_map()
    assert "nodes" in stadium_map
    assert "edges" in stadium_map
    assert len(stadium_map["nodes"]) > 0


def test_find_shortest_path_standard():
    stadium_map = load_stadium_map()
    # Path: section_101 -> elevator_1 -> restroom_north_2
    path, dist, seconds = find_shortest_path(
        start_id="section_101",
        end_id="restroom_north_2",
        accessible_only=False,
        node_congestions={},
        stadium_map=stadium_map,
    )
    assert path[0] == "section_101"
    assert path[-1] == "restroom_north_2"
    assert dist == 45.0  # 30 + 15
    assert seconds > 0.0


def test_find_shortest_path_accessible_filter():
    stadium_map = load_stadium_map()

    # Path: section_101 to restroom_north_1 is via stairs_1 (inaccessible)
    # Accessible only route should fail since restroom_north_1 is not accessible and uses stairs
    with pytest.raises(RouteNotFoundError):
        find_shortest_path(
            start_id="section_101",
            end_id="restroom_north_1",
            accessible_only=True,
            node_congestions={},
            stadium_map=stadium_map,
        )


def test_find_shortest_path_node_not_found():
    stadium_map = load_stadium_map()
    with pytest.raises(NodeNotFoundError):
        find_shortest_path(
            start_id="invalid_node",
            end_id="section_114",
            accessible_only=False,
            node_congestions={},
            stadium_map=stadium_map,
        )


def test_congestion_weight_scaling():
    stadium_map = load_stadium_map()
    # Compute path with no congestion
    path_no_c, dist_no_c, seconds_no_c = find_shortest_path(
        start_id="gate_a",
        end_id="restroom_north_2",
        accessible_only=False,
        node_congestions={},
        stadium_map=stadium_map,
    )

    # Compute path with high congestion on elevator_1 (which is on the path)
    node_congestions = {"elevator_1": 0.95}
    path_c, dist_c, seconds_c = find_shortest_path(
        start_id="gate_a",
        end_id="restroom_north_2",
        accessible_only=False,
        node_congestions=node_congestions,
        stadium_map=stadium_map,
    )
    # High congestion on elevator_1 should cause the engine to reroute via stairs
    assert path_c != path_no_c
    assert seconds_c > 0.0


def test_generate_steps():
    stadium_map = load_stadium_map()
    path = ["gate_a", "section_101", "elevator_1", "restroom_north_2"]
    steps = generate_steps(path, stadium_map, {})
    assert len(steps) == 3
    assert "Gate A" in steps[0]["instruction"]
    assert "Section 101" in steps[0]["instruction"]
    assert steps[0]["distance_meters"] == 50.0

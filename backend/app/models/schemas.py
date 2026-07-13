from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    current_location: str = Field(
        ...,
        max_length=100,
        description="ID of starting gate or section, e.g., 'gate_a'",
    )
    destination_intent: str = Field(
        ...,
        max_length=500,
        description="Free text user intent, e.g., 'accessible restroom near section 114'",
    )
    accessible_only: bool = Field(False, description="Filter for step-free routes")
    stadium_id: str = Field(
        "stadium_metlife", max_length=100, description="The stadium identifier"
    )


class RouteStep(BaseModel):
    instruction: str
    distance_meters: float
    estimated_seconds: float
    accessible: bool


class RouteResponse(BaseModel):
    path: list[str] = Field(..., description="List of node IDs from start to end")
    steps: list[RouteStep] = Field(...)
    total_distance_meters: float
    total_estimated_seconds: float
    accessible_only: bool
    congestion_level: str  # "Low", "Medium", "High"
    destination_node_id: str
    stadium_id: str = "stadium_metlife"


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., max_length=2000, description="Content of the message")


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., description="Conversational history")
    language: str | None = Field(
        None,
        max_length=10,
        description="Manually specified language code, otherwise autodetect",
    )
    stadium_id: str = Field(
        "stadium_metlife", max_length=100, description="The stadium identifier"
    )


class CrowdZoneStatus(BaseModel):
    zone_id: str
    zone_name: str
    density_score: float = Field(..., ge=0.0, le=1.0)
    occupancy_percentage: float = Field(..., ge=0.0, le=100.0)
    queue_time_minutes: int
    status: str  # "Normal", "Crowded", "Critical"


class CrowdStatusResponse(BaseModel):
    zones: list[CrowdZoneStatus]
    timestamp: str
    stadium_id: str = "stadium_metlife"


class OpsSummaryResponse(BaseModel):
    summary: str
    recommended_actions: list[str]
    timestamp: str
    stadium_id: str = "stadium_metlife"


class TransitRequest(BaseModel):
    origin: str = Field(
        ..., max_length=500, description="Origin location name, e.g., 'Downtown Hotel'"
    )
    stadium_id: str = Field(
        "stadium_metlife", max_length=100, description="The stadium identifier"
    )


class TransitOption(BaseModel):
    mode: str  # "Bus", "Train", "Metro", "Electric Shuttle", "Walk"
    name: str
    duration_minutes: int
    co2_grams: float
    co2_saved: float = Field(
        0.0, description="CO2 saved in grams compared to standard driving"
    )
    accessibility_features: list[str]
    recommendation_reason: str


class TransitResponse(BaseModel):
    origin: str
    destination: str
    options: list[TransitOption]
    sustainability_tip: str
    stadium_id: str = "stadium_metlife"


class IncidentReport(BaseModel):
    reporter_role: str = Field(
        ..., max_length=50, description="e.g. 'Volunteer' or 'Organizer'"
    )
    location_node_id: str = Field(
        ..., max_length=100, description="The node ID where incident occurred"
    )
    incident_type: str = Field(
        ..., max_length=100, description="e.g. 'Spill', 'Crowd Surge', 'Medical'"
    )
    details: str = Field(
        ..., max_length=1000, description="Free text details of the incident"
    )
    stadium_id: str = Field(
        "stadium_metlife", max_length=100, description="The stadium identifier"
    )


class IncidentReportResponse(BaseModel):
    success: bool
    incident_id: str
    message: str

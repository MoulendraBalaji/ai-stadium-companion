from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    current_location: str = Field(
        ..., description="ID of starting gate or section, e.g., 'gate_a'"
    )
    destination_intent: str = Field(
        ...,
        description="Free text user intent, e.g., 'accessible restroom near section 114'",
    )
    accessible_only: bool = Field(False, description="Filter for step-free routes")


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


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., description="Conversational history")
    language: str | None = Field(
        None, description="Manually specified language code, otherwise autodetect"
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


class OpsSummaryResponse(BaseModel):
    summary: str
    recommended_actions: list[str]
    timestamp: str


class TransitRequest(BaseModel):
    origin: str = Field(..., description="Origin location name, e.g., 'Downtown Hotel'")


class TransitOption(BaseModel):
    mode: str  # "Bus", "Train", "Metro", "Electric Shuttle", "Walk"
    name: str
    duration_minutes: int
    co2_grams: float
    accessibility_features: list[str]
    recommendation_reason: str


class TransitResponse(BaseModel):
    origin: str
    destination: str
    options: list[TransitOption]
    sustainability_tip: str

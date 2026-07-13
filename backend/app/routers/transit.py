import json
import logging

from fastapi import APIRouter, Query

from app.ai_service import generate_text
from app.models.schemas import TransitOption, TransitResponse

logger = logging.getLogger("transit_router")
router = APIRouter(prefix="/api/transit", tags=["transit"])

# Grams of CO2 per passenger-kilometer for various transit modes
EMISSION_FACTORS = {
    "Metro": 35.0,
    "Train": 40.0,
    "Electric Shuttle": 12.0,
    "Electric Bus": 15.0,
    "Walk": 0.0,
    "Gasoline Car": 180.0,  # Baseline driving emissions
}


def calculate_sustainability_metrics(origin: str, mode: str) -> tuple[float, float]:
    """
    Calculates CO2 emissions and CO2 savings compared to a gasoline car.
    Uses a stable, deterministic distance based on the length of the origin text.
    """
    # Deterministic distance between 5 and 20 kilometers
    distance_km = (len(origin) % 15) + 5.0
    factor = EMISSION_FACTORS.get(mode, 35.0)  # default to metro emission factor
    co2_grams = distance_km * factor
    co2_saved = (EMISSION_FACTORS["Gasoline Car"] - factor) * distance_km
    return round(co2_grams, 1), round(co2_saved, 1)


@router.get("/suggestions", response_model=TransitResponse)
async def get_transit_suggestions(
    origin: str = Query(
        "Downtown Fan Zone", description="Origin location to calculate route from"
    ),
    stadium_id: str = "stadium_metlife"
):
    """
    Returns eco-friendly, low-emission transit suggestions from a simulated origin.
    Uses Gemini API to structure suggestions and recalculates emissions deterministically.
    """
    system_instruction = (
        "You are a sustainability transit planner for the FIFA World Cup 2026.\n"
        "Generate a set of green, low-carbon transit options (Metro, Electric Shuttle, Train, Walk) to the stadium.\n"
        "Respond ONLY with a JSON object in this format (no other text, no markdown block):\n"
        "{\n"
        '  "origin": "Origin Name",\n'
        '  "destination": "Estadio Azteca / Stadium West Gate",\n'
        '  "options": [\n'
        "    {\n"
        '      "mode": "Metro|Electric Shuttle|Train|Walk",\n'
        '      "name": "Transit Line Name",\n'
        '      "duration_minutes": 20,\n'
        '      "accessibility_features": ["Wheelchair accessible", "Audio announcements"],\n'
        '      "recommendation_reason": "Most direct low-carbon pathway."\n'
        "    }\n"
        "  ],\n"
        '  "sustainability_tip": "A practical tip for green travel during match day."\n'
        "}"
    )

    prompt = f"Transit Origin: '{origin}'"

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
        options = []
        for opt in data.get("options", []):
            mode = opt.get("mode", "Metro")
            co2, saved = calculate_sustainability_metrics(origin, mode)
            options.append(
                TransitOption(
                    mode=mode,
                    name=opt.get("name", "Transit Line"),
                    duration_minutes=opt.get("duration_minutes", 20),
                    co2_grams=co2,
                    co2_saved=saved,
                    accessibility_features=opt.get("accessibility_features", []),
                    recommendation_reason=opt.get("recommendation_reason", "Green option.")
                )
            )

        return TransitResponse(
            origin=data.get("origin", origin),
            destination=data.get("destination", "FIFA 2026 Arena"),
            options=options,
            sustainability_tip=data.get(
                "sustainability_tip",
                "Avoid traffic and reduce emissions by using the electric shuttle network.",
            ),
            stadium_id=stadium_id
        )
    except Exception as e:
        logger.error(f"Error generating transit suggestions: {e}")
        # Return fallback structured response with calculated metrics
        m_co2, m_saved = calculate_sustainability_metrics(origin, "Metro")
        s_co2, s_saved = calculate_sustainability_metrics(origin, "Electric Shuttle")

        return TransitResponse(
            origin=origin,
            destination="FIFA World Cup 2026 Stadium",
            options=[
                TransitOption(
                    mode="Metro",
                    name="Green Line 4",
                    duration_minutes=25,
                    co2_grams=m_co2,
                    co2_saved=m_saved,
                    accessibility_features=[
                        "Elevators at all platforms",
                        "Tactile paving",
                    ],
                    recommendation_reason="Highly reliable and produces 80% fewer emissions than private vehicles.",
                ),
                TransitOption(
                    mode="Electric Shuttle",
                    name="Express Gate Shuttle",
                    duration_minutes=15,
                    co2_grams=s_co2,
                    co2_saved=s_saved,
                    accessibility_features=[
                        "Low-floor ramp",
                        "Dedicated priority seating",
                    ],
                    recommendation_reason="Zero-tailpipe emissions, direct link from Downtown transit hubs.",
                ),
            ],
            sustainability_tip="Show your digital match ticket for free passage on all regional electric shuttles!",
            stadium_id=stadium_id
        )

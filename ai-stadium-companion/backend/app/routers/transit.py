import json
import logging

from fastapi import APIRouter, Query

from app.ai_service import generate_text
from app.models.schemas import TransitOption, TransitResponse

logger = logging.getLogger("transit_router")
router = APIRouter(prefix="/api/transit", tags=["transit"])


@router.get("/suggestions", response_model=TransitResponse)
async def get_transit_suggestions(
    origin: str = Query(
        "Downtown Fan Zone", description="Origin location to calculate route from"
    )
):
    """
    Returns eco-friendly, low-emission transit suggestions from a simulated origin.
    Uses Gemini API to structure recommendations.
    """
    system_instruction = (
        "You are a sustainability transit planner for the FIFA World Cup 2026.\n"
        "Generate a set of green, low-carbon transit options (metro, electric bus, cycling, walking) to the stadium.\n"
        "Include estimated CO2 emissions, duration, and accessibility details.\n"
        "Respond ONLY with a JSON object in this format (no other text, no markdown block):\n"
        "{\n"
        '  "origin": "Origin Name",\n'
        '  "destination": "Estadio Azteca / Stadium West Gate",\n'
        '  "options": [\n'
        "    {\n"
        '      "mode": "Metro|Electric Shuttle|Train|Walk",\n'
        '      "name": "Transit Line Name",\n'
        '      "duration_minutes": 20,\n'
        '      "co2_grams": 120.5,\n'
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
        options = [TransitOption(**opt) for opt in data.get("options", [])]
        return TransitResponse(
            origin=data.get("origin", origin),
            destination=data.get("destination", "FIFA 2026 Arena"),
            options=options,
            sustainability_tip=data.get(
                "sustainability_tip",
                "Avoid traffic and reduce emissions by using the electric shuttle network.",
            ),
        )
    except Exception as e:
        logger.error(f"Error generating transit suggestions: {e}")
        # Return fallback structured response
        return TransitResponse(
            origin=origin,
            destination="FIFA World Cup 2026 Stadium",
            options=[
                TransitOption(
                    mode="Metro",
                    name="Green Line 4",
                    duration_minutes=25,
                    co2_grams=95.0,
                    accessibility_features=[
                        "Elevators at all platforms",
                        "Tactile paving",
                    ],
                    recommendation_reason="Highly reliable and produces 90% fewer emissions than private vehicles.",
                ),
                TransitOption(
                    mode="Electric Shuttle",
                    name="Express Gate Shuttle",
                    duration_minutes=15,
                    co2_grams=0.0,
                    accessibility_features=[
                        "Low-floor ramp",
                        "Dedicated priority seating",
                    ],
                    recommendation_reason="Zero emissions, direct link from Downtown transit hubs.",
                ),
            ],
            sustainability_tip="Show your digital match ticket for free passage on all regional electric shuttles!",
        )

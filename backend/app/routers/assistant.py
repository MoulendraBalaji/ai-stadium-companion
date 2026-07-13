import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.ai_service import generate_response_stream
from app.exceptions import ConcurrentConnectionsExceededError
from app.models.schemas import ChatRequest
from app.services.language_service import SUPPORTED_LANGUAGES, detect_language

logger = logging.getLogger("assistant_router")
router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# In-memory tracking for active SSE connections per client IP
active_connections: dict[str, int] = {}
MAX_CONCURRENT_SSE = 3


@router.post("/chat")
async def chat_endpoint(chat_request: ChatRequest, request: Request):
    """
    Auto-detects language and replies fluently using Gemini streaming.
    Returns a text/event-stream SSE response.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Enforce active connection ceiling per client
    current_conn = active_connections.get(client_ip, 0)
    if current_conn >= MAX_CONCURRENT_SSE:
        logger.warning(f"Client {client_ip} exceeded maximum concurrent SSE connections.")
        raise ConcurrentConnectionsExceededError()

    history = chat_request.messages
    user_query = history[-1].content if history else ""

    # Language detection
    detected_lang = chat_request.language or detect_language(user_query)
    lang_name = SUPPORTED_LANGUAGES.get(detected_lang, "English")

    logger.info(f"Auto-detected language for query: {detected_lang} ({lang_name})")

    # Formulate system instruction based on detected language
    system_instruction = (
        f"You are the official AI Stadium Companion for the FIFA World Cup 2026.\n"
        f"You MUST respond fluently and naturally in the following language: {lang_name} (code: {detected_lang}).\n"
        f"Provide helpful, concise, and friendly information regarding stadium gates, matches, seating sections, accessibility features, restrooms, concessions, and security.\n"
        f"Ensure your tone is polite and matches the excitement of the tournament. Avoid long paragraphs. Use lists/bullet points when listing features."
    )

    # Format messages for the stream generator
    formatted_messages = []
    for msg in history:
        formatted_messages.append({"role": msg.role, "content": msg.content})

    async def event_generator():
        # Register connection
        active_connections[client_ip] = active_connections.get(client_ip, 0) + 1
        try:
            async for chunk in generate_response_stream(
                formatted_messages, system_instruction
            ):
                # Send JSON chunk inside SSE formatting
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Error in SSE stream generator: {e}")
            yield f"data: {json.dumps({'chunk': ' [Stream interrupted due to an error] '})}\n\n"
        finally:
            # Deregister connection
            active_connections[client_ip] = max(0, active_connections.get(client_ip, 1) - 1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

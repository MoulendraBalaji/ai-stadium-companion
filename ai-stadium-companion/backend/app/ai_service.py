import asyncio
import hashlib
import logging
import time
from collections.abc import AsyncGenerator

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

# In-Memory TTL Cache
# Key: hash string, Value: (response_text, expiration_timestamp)
_cache: dict[str, tuple[str, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes TTL

# Prompt Injection Guards
INJECTION_KEYWORDS = [
    "ignore previous instructions",
    "ignore all instructions",
    "forget everything",
    "you are now a",
    "bypass",
    "system prompt",
    "override",
]


def check_prompt_injection(text: str) -> bool:
    """
    Checks if the user content contains typical prompt injection markers.
    """
    text_lower = text.lower()
    for word in INJECTION_KEYWORDS:
        if word in text_lower:
            logger.warning(
                f"Possible prompt injection detected containing keyword: {word}"
            )
            return True
    return False


def get_cache_key(prompt: str, system_instruction: str) -> str:
    combined = f"sys:{system_instruction}||user:{prompt}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def get_cached_response(key: str) -> str | None:
    if key in _cache:
        val, expires = _cache[key]
        if time.time() < expires:
            logger.info("Serving LLM response from TTL cache.")
            return val
        else:
            del _cache[key]
    return None


def set_cached_response(key: str, response: str) -> None:
    _cache[key] = (response, time.time() + CACHE_TTL_SECONDS)


# Check SDK availability and initialize Client
MOCK_MODE = False
if not settings.GEMINI_API_KEY:
    MOCK_MODE = True
    logger.info("No GEMINI_API_KEY found. Running in MOCK_MODE.")
else:
    try:
        from google import genai

        # Initialize client
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Successfully initialized google-genai client.")
    except Exception as e:
        MOCK_MODE = True
        logger.error(
            f"Failed to import/initialize google-genai SDK: {e}. Falling back to MOCK_MODE."
        )


def get_mock_reply(prompt: str, system_instruction: str) -> str:
    """
    Generates realistic responses based on simulated stadium intent.
    Matches English, Spanish, French, Portuguese, Arabic requests.
    """
    prompt_lower = prompt.lower()

    # 1. Check Language
    # If the user speaks Spanish, French, Portuguese, Arabic, we respond accordingly
    is_spanish = any(
        w in prompt_lower
        for w in [
            "hola",
            "gracias",
            "baño",
            "restroom",
            "donde",
            "ruta",
            "seccion",
            "entrada",
        ]
    ) and (
        "espanol" in system_instruction.lower()
        or "spanish" in system_instruction.lower()
    )
    is_french = any(
        w in prompt_lower for w in ["bonjour", "merci", "toilette", "ou", "entree"]
    ) and (
        "french" in system_instruction.lower()
        or "français" in system_instruction.lower()
    )
    is_portuguese = any(
        w in prompt_lower for w in ["obrigado", "onde", "banheiro", "entrada", "rota"]
    ) and (
        "portuguese" in system_instruction.lower()
        or "português" in system_instruction.lower()
    )
    is_arabic = any(ord(c) >= 0x0600 and ord(c) <= 0x06FF for c in prompt)

    # Detect ops summary prompt
    if (
        "telemetry" in prompt_lower
        or "ops" in prompt_lower
        or "incident" in prompt_lower
        or "capacity" in prompt_lower
    ):
        return (
            "**STADIUM OPERATIONS INTELLIGENCE REPORT**\n\n"
            "**Current Status:** Gate C (East) is experiencing high congestion (92% capacity, ~25m wait times). All other gates remain normal (Low/Medium density).\n\n"
            "**Recommended Actions:**\n"
            "1. Dispatch Volunteer Team Bravo to Gate C to guide incoming fans to Gate B (South Entrance) or Gate D (West Entrance).\n"
            "2. Trigger automated signs in the East Plaza indicating alternative routes.\n"
            "3. Prepare to open overflow gates in Section 120."
        )

    # Detect transit prompt
    if (
        "transit" in prompt_lower
        or "sustainability" in prompt_lower
        or "bus" in prompt_lower
        or "metro" in prompt_lower
    ):
        return (
            "Here are eco-friendly transit recommendations to the FIFA World Cup Stadium:\n\n"
            "- **Option 1: Metro Line 6 (Low Emission)**\n"
            "  - Duration: 25 minutes\n"
            "  - CO2 saving: ~85% relative to driving\n"
            "  - Accessibility: Fully step-free, tactile paving, wheelchair designated spaces.\n\n"
            "- **Option 2: Electric Stadium Shuttle (Zero Emission)**\n"
            "  - Duration: 15 minutes (runs every 5 mins from Downtown Plaza)\n"
            "  - CO2 saving: 100%\n"
            "  - Accessibility: Low-floor ramp, audio announcements."
        )

    # Localized messages
    if is_arabic:
        return (
            "مرحبًا بك في مساعد استاد كأس العالم لكرة القدم ٢٠٢٦! 🏟️\n\n"
            "- **الملاحة**: لقد وجدت أن أقرب دورة مياه يمكن الوصول إليها لذوي الاحتياجات الخاصة تقع بالقرب من القسم ١١٤ (بجوار المصعد الشمالي).\n"
            "- **نصيحة الحشود**: البوابة C مزدحمة حاليًا؛ يرجى استخدام البوابة A أو B لتوفير ما يصل إلى ١٥ دقيقة.\n"
            "كيف يمكنني مساعدتك أكثر اليوم؟"
        )
    elif is_spanish:
        return (
            "¡Bienvenido al Asistente del Estadio de la Copa Mundial de la FIFA 2026! 🏟️\n\n"
            "- **Navegación**: He localizado el baño accesible más cercano cerca de la Sección 114 (al lado del elevador norte).\n"
            "- **Crowd Alert**: La Puerta C (Este) está muy congestionada en este momento. Le sugiero ingresar por la Puerta A o B para ahorrar unos 15 minutos.\n"
            "¿En qué más puedo ayudarle hoy?"
        )
    elif is_french:
        return (
            "Bienvenue à l'Assistant de Stade de la Coupe du Monde de la FIFA 2026 ! 🏟️\n\n"
            "- **Navigation**: Les toilettes accessibles les plus proches se trouvent à côté de la section 114 (près de l'ascenseur nord).\n"
            "- **Crowd Alert**: La porte C (Est) est très encombrée. Utilisez les entrées A ou B pour gagner du temps.\n"
            "Comment puis-je vous aider aujourd'hui ?"
        )
    elif is_portuguese:
        return (
            "Bem-vindo ao Assistente do Estádio da Copa do Mundo FIFA 2026! 🏟️\n\n"
            "- **Navegação**: O banheiro acessível mais próximo fica perto da Seção 114 (ao lado do elevador norte).\n"
            "- **Crowd Alert**: O Portão C está muito congestionado. Recomendo utilizar os portões A ou B para economizar tempo.\n"
            "Como posso ajudar você hoje?"
        )
    else:
        # Default English
        return (
            "Welcome to the FIFA World Cup 2026 Stadium Companion! 🏟️\n\n"
            "- **Navigation**: I have found a step-free accessible restroom next to Section 114 (just past the North Elevator).\n"
            "- **Crowd Status**: Gate C is currently experiencing high congestion (92% occupancy). I recommend rerouting to Gate A or Gate B for faster entry.\n"
            "- **Transit**: Take the Electric Shuttle from gate entrances for a low-emission option.\n\n"
            "How can I assist you with your tournament experience today?"
        )


async def generate_response_stream(
    messages: list[dict[str, str]], system_instruction: str
) -> AsyncGenerator[str, None]:
    """
    Streams a response chunk-by-chunk. If MOCK_MODE is enabled or API key fails,
    simulates streaming realistic local strings.
    """
    user_prompt = messages[-1]["content"] if messages else ""

    # 1. Prompt Injection Guard check
    if check_prompt_injection(user_prompt):
        yield "Security Alert: Request rejected. Malformed or dangerous input pattern detected."
        return

    # Check cache (build key from the last prompt + system instruction)
    cache_key = get_cache_key(user_prompt, system_instruction)
    cached_text = get_cached_response(cache_key)
    if cached_text:
        # Simulate streaming cached response
        for chunk in cached_text.split(" "):
            yield chunk + " "
            await asyncio.sleep(0.02)
        return

    if MOCK_MODE:
        response_text = get_mock_reply(user_prompt, system_instruction)
        # Cache full response
        set_cached_response(cache_key, response_text)

        # Simulate chunk streaming
        words = response_text.split(" ")
        for word in words:
            yield word + " "
            await asyncio.sleep(0.04)
        return

    # Real LLM call with retry
    retries = 3
    delay = 1.0
    for attempt in range(retries):
        try:
            # Build history for Gemini SDK
            # Format contents from messages
            from google.genai import types

            # Formulate generation config with system instructions
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=800,
            )

            # Map roles: 'user' -> 'user', 'assistant' -> 'model'
            contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                contents.append(
                    types.Content(
                        role=role, parts=[types.Part.from_text(text=m["content"])]
                    )
                )

            # Call streaming API
            response_stream = client.models.generate_content_stream(
                model="gemini-2.5-flash", contents=contents, config=config
            )

            full_response = ""
            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text

            # Set to cache after successful stream
            set_cached_response(cache_key, full_response)
            return

        except Exception as e:
            logger.error(f"Attempt {attempt+1} failed with error: {e}")
            if attempt == retries - 1:
                # Last attempt failed, yield fallback
                logger.error("All retries exhausted for Gemini API call.")
                from app.services.language_service import (
                    detect_language,
                    get_fallback_message,
                )

                lang = detect_language(user_prompt)
                fallback_msg = get_fallback_message(lang)
                yield fallback_msg
            else:
                await asyncio.sleep(delay)
                delay *= 2.0


async def generate_text(prompt: str, system_instruction: str = "") -> str:
    """
    Synchronous generation wrapper (async-friendly). Returns a full string.
    """
    # 1. Prompt Injection Guard check
    if check_prompt_injection(prompt):
        return "Security Alert: Request rejected. Malformed or dangerous input pattern detected."

    cache_key = get_cache_key(prompt, system_instruction)
    cached_text = get_cached_response(cache_key)
    if cached_text:
        return cached_text

    if MOCK_MODE:
        response_text = get_mock_reply(prompt, system_instruction)
        set_cached_response(cache_key, response_text)
        return response_text

    retries = 3
    delay = 1.0
    for attempt in range(retries):
        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt, config=config
            )

            res_text = response.text or ""
            set_cached_response(cache_key, res_text)
            return res_text

        except Exception as e:
            logger.error(f"Sync attempt {attempt+1} failed: {e}")
            if attempt == retries - 1:
                from app.services.language_service import (
                    detect_language,
                    get_fallback_message,
                )

                lang = detect_language(prompt)
                return get_fallback_message(lang)
            else:
                await asyncio.sleep(delay)
                delay *= 2.0
    return "Error generating response."

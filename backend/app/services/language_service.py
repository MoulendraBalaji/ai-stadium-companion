import re

# Map language codes to English names
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "pt": "Portuguese",
    "fr": "French",
    "ar": "Arabic",
}

# Simple rules-based language detection based on keywords and characters
# This acts as a fast client-side check or backend fallback before sending to LLM.
LANG_PATTERNS = [
    (
        r"\b(hola|gracias|adios|buenos|dias|tardes|noches|por\s+favor|donde|baño|entrada|seccion)\b",
        "es",
    ),
    (
        r"\b(bonjour|merci|salut|s'il\s+vous\s+plaît|où|toilettes|entrée|section)\b",
        "fr",
    ),
    (
        r"\b(obrigado|bom\s+dia|boa\s+tarde|por\s+favor|onde|banheiro|entrada|seção)\b",
        "pt",
    ),
    # Arabic unicode block check: range U+0600 to U+06FF
    (r"[\u0600-\u06FF]+", "ar"),
]

FALLBACK_MESSAGES = {
    "en": "I'm sorry, I encountered an issue. Let me help you in English. How can I assist you at the World Cup today?",
    "es": "Lo siento, encontré un problema. Permítame ayudarle en español. ¿Cómo puedo asistirlo en la Copa Mundial hoy?",
    "pt": "Desculpe, ocorreu um problema. Deixe-me ajudá-lo em português. Como posso ajudar você na Copa do Mundo hoje?",
    "fr": "Désolé, j'ai rencontré un problème. Laissez-moi vous aider en français. Comment puis-je vous aider à la Coupe du Monde aujourd'hui?",
    "ar": "عذرًا، حدثت مشكلة. دعني أساعدك باللغة العربية. كيف يمكنني مساعدتك في كأس العالم اليوم؟",
}


def detect_language(text: str) -> str:
    """
    Detects language based on character range and keywords.
    Returns 'en', 'es', 'pt', 'fr', or 'ar'.
    Defaults to 'en' (English).
    """
    if not text:
        return "en"

    text_lower = text.lower()
    for pattern, lang in LANG_PATTERNS:
        if re.search(pattern, text_lower):
            return lang

    return "en"


def get_fallback_message(lang: str) -> str:
    """
    Returns the localized fallback error message.
    """
    return FALLBACK_MESSAGES.get(lang, FALLBACK_MESSAGES["en"])

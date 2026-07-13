class StadiumCompanionError(Exception):
    """Base exception class for AI Stadium Companion app."""

    pass


class RouteNotFoundError(StadiumCompanionError):
    """Raised when no route can be found between two nodes."""

    def __init__(
        self,
        message: str = "No suitable route could be calculated between the selected locations.",
    ):
        self.message = message
        super().__init__(self.message)


class NodeNotFoundError(StadiumCompanionError):
    """Raised when a specified node ID does not exist in the graph database."""

    def __init__(self, node_id: str):
        self.node_id = node_id
        self.message = (
            f"Location node ID '{node_id}' not found in the stadium map database."
        )
        super().__init__(self.message)


class UnsupportedLanguageError(StadiumCompanionError):
    """Raised when the specified language is not supported."""

    def __init__(self, lang: str):
        self.lang = lang
        self.message = f"Language code '{lang}' is not supported. Supported codes: en, es, pt, fr, ar."
        super().__init__(self.message)


class AuthenticationError(StadiumCompanionError):
    """Raised when staff authentication fails."""

    def __init__(
        self, message: str = "Unauthorized access. Invalid or missing bearer token."
    ):
        self.message = message
        super().__init__(self.message)


class ForbiddenAccessError(StadiumCompanionError):
    """Raised when access is forbidden for the authenticated user role."""

    def __init__(
        self, message: str = "Forbidden. Access restricted to authorized stadium staff."
    ):
        self.message = message
        super().__init__(self.message)


class RateLimitExceededError(StadiumCompanionError):
    """Raised when a client IP exceeds the rate limits."""

    def __init__(self, message: str = "Rate limit exceeded. Too many requests."):
        self.message = message
        super().__init__(self.message)


class ConcurrentConnectionsExceededError(StadiumCompanionError):
    """Raised when a client IP exceeds concurrent SSE connection limits."""

    def __init__(
        self,
        message: str = "Too many concurrent assistant stream connections. Please close existing sessions.",
    ):
        self.message = message
        super().__init__(self.message)

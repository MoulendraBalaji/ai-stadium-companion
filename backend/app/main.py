import asyncio
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.exceptions import (
    AuthenticationError,
    ConcurrentConnectionsExceededError,
    ForbiddenAccessError,
    NodeNotFoundError,
    RateLimitExceededError,
    RouteNotFoundError,
    UnsupportedLanguageError,
)
from app.routers import assistant, crowd, navigation, ops_dashboard, transit

# Configure logger
logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="FIFA World Cup 2026 Stadium Companion API",
    description="GenAI-enabled solution for navigation, crowd management, accessibility, and multilingual assistant.",
    version="1.0.0",
)


# Token Bucket Rate Limiter for Prototype
class TokenBucketRateLimiter:
    def __init__(self, max_tokens: int, refill_rate: float):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.tokens = float(max_tokens)
        self.last_refill = time.time()
        self.lock = asyncio.Lock()

    async def consume(self) -> bool:
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.last_refill = now
            self.tokens = min(
                float(self.max_tokens), self.tokens + elapsed * self.refill_rate
            )

            if self.tokens >= 1.0:
                self.tokens -= 1.0
                return True
            return False


limiter = TokenBucketRateLimiter(
    max_tokens=settings.RATE_LIMIT_TOKENS, refill_rate=settings.RATE_LIMIT_REFILL_RATE
)


# Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            if not await limiter.consume():
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Too many requests."},
                )
        return await call_next(request)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none';"
        )
        return response


app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
allow_origins = [origin for origin in settings.cors_origins_list if origin != "*"]
if not allow_origins or settings.ENVIRONMENT == "development":
    allow_origins.extend(
        [
            "http://localhost:5234",
            "http://127.0.0.1:5234",
            "http://localhost:5173",
            "http://localhost:3000",
        ]
    )

allow_origins = list(set(allow_origins))
allow_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Logging and Error Handling
@app.middleware("http")
async def log_and_handle_errors(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        # Redact free-text query content in logs for PII security
        path = request.url.path
        query_params = dict(request.query_params)
        if "origin" in query_params:
            query_params["origin"] = "[REDACTED]"

        logger.info(
            f"Method: {request.method} Path: {path} Params: {query_params} Status: {response.status_code} Time: {process_time:.4f}s"
        )
        return response
    except Exception as e:
        logger.error(f"Unhandled server exception: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal server error occurred. Please contact stadium support."
            },
        )


# Register routers
app.include_router(navigation.router)
app.include_router(assistant.router)
app.include_router(crowd.router)
app.include_router(ops_dashboard.router)
app.include_router(transit.router)


@app.exception_handler(RouteNotFoundError)
async def route_not_found_handler(request: Request, exc: RouteNotFoundError):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(NodeNotFoundError)
async def node_not_found_handler(request: Request, exc: NodeNotFoundError):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(UnsupportedLanguageError)
async def unsupported_language_handler(request: Request, exc: UnsupportedLanguageError):
    return JSONResponse(status_code=400, content={"detail": exc.message})


@app.exception_handler(AuthenticationError)
async def authentication_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(status_code=401, content={"detail": exc.message})


@app.exception_handler(ForbiddenAccessError)
async def forbidden_access_handler(request: Request, exc: ForbiddenAccessError):
    return JSONResponse(status_code=403, content={"detail": exc.message})


@app.exception_handler(RateLimitExceededError)
async def rate_limit_handler(request: Request, exc: RateLimitExceededError):
    return JSONResponse(status_code=429, content={"detail": exc.message})


@app.exception_handler(ConcurrentConnectionsExceededError)
async def concurrent_connections_handler(
    request: Request, exc: ConcurrentConnectionsExceededError
):
    return JSONResponse(status_code=429, content={"detail": exc.message})


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "FIFA World Cup 2026 Stadium Companion API is fully operational.",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

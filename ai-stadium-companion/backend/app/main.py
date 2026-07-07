import asyncio
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
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


app.add_middleware(RateLimitMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

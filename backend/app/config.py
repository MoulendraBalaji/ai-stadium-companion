from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str | None = None
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5234,http://127.0.0.1:5234"
    RATE_LIMIT_TOKENS: int = 100
    RATE_LIMIT_REFILL_RATE: float = 1.0  # tokens per second

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]


settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./inventory.db"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    ai_provider: str = "openai"
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    openai_fallback_api_base: str = ""
    openai_fallback_model: str = ""

    google_api_key: str = ""
    google_api_base: str = "https://generativelanguage.googleapis.com/v1beta2"
    google_model: str = "text-bison-001"

    openrouter_api_key: str = ""
    openrouter_api_base: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "~openai/gpt-latest"

    class Config:
        env_file = ".env"


settings = Settings()

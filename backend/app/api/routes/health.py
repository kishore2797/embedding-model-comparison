"""Health check route."""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.config import OPENAI_API_KEY, COHERE_API_KEY, MODEL_REGISTRY

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    local_count = sum(1 for v in MODEL_REGISTRY.values() if v["provider"] == "local")
    return HealthResponse(
        status="healthy",
        available_models=len(MODEL_REGISTRY),
        openai_configured=bool(OPENAI_API_KEY),
        cohere_configured=bool(COHERE_API_KEY),
        local_models_available=local_count > 0,
    )

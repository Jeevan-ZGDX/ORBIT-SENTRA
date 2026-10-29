from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api import auth, vitals, sync, surgeon, datasets

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="ASTRA-Guard Health Monitoring & Early Warning System API for NASA Space Apps Challenge 2026",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development & demo PWA
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(vitals.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(surgeon.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ASTRA-Guard Mission Health Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

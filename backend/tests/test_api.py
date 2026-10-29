import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_login_demo_users():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test astronaut login
        res = await ac.post("/api/v1/auth/login", data={"username": "astronaut1", "password": "password123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "astronaut"

        # Test surgeon login
        res_surg = await ac.post("/api/v1/auth/login", data={"username": "surgeon1", "password": "password123"})
        assert res_surg.status_code == 200
        assert res_surg.json()["role"] == "flight_surgeon"

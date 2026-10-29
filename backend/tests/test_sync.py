import uuid
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_batch_sync_and_idempotency():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as astronaut
        login_res = await ac.post("/api/v1/auth/login", data={"username": "astronaut1", "password": "password123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Prepare batch payload
        ast_id = "11111111-1111-1111-1111-111111111111"
        test_event_id = str(uuid.uuid4())
        payload = {
            "astronaut_id": ast_id,
            "observations": [
                {
                    "event_id": test_event_id,
                    "astronaut_id": ast_id,
                    "measurement": "heart_rate",
                    "value": 72.5,
                    "unit": "bpm",
                    "observed_at": datetime.now(timezone.utc).isoformat(),
                    "source": "simulator",
                    "quality": "valid",
                    "context": {"activity": "rest"}
                }
            ],
            "sleep_sessions": [],
            "fatigue_assessments": [],
            "anomalies": []
        }

        # 3. First sync call
        res1 = await ac.post("/api/v1/sync", json=payload, headers=headers)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["processed_count"] == 1
        assert data1["duplicate_count"] == 0
        assert data1["receipts"][0]["status"] == "synced"

        # 4. Second sync call with same payload (Idempotency test)
        res2 = await ac.post("/api/v1/sync", json=payload, headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["processed_count"] == 0
        assert data2["duplicate_count"] == 1
        assert data2["receipts"][0]["status"] == "duplicate"

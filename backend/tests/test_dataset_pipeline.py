import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_dataset_sources_and_acquisition_pipeline():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. List official sources
        sources_res = await ac.get("/api/v1/datasets/sources")
        assert sources_res.status_code == 200
        sources = sources_res.json()
        assert len(sources) >= 4
        source_ids = [s["source_id"] for s in sources]
        assert "nasa_osdr" in source_ids
        assert "physionet_bidmc" in source_ids
        assert "nasa_nlsp" in source_ids

        # 2. Acquire NASA OSDR Dataset
        acq_osdr = await ac.post("/api/v1/datasets/acquire/nasa_osdr")
        assert acq_osdr.status_code == 200
        data_osdr = acq_osdr.json()
        assert data_osdr["status"] == "ACQUISITION_SUCCESS"
        assert "sha256_checksum" in data_osdr
        assert len(data_osdr["sha256_checksum"]) == 64  # Valid SHA-256
        assert data_osdr["split_summary"]["subject_leakage_status"] == "PASSED_ZERO_LEAKAGE"
        assert data_osdr["quality_report"]["status"] == "PASSED"

        # 3. Acquire PhysioNet BIDMC Dataset
        acq_physio = await ac.post("/api/v1/datasets/acquire/physionet_bidmc")
        assert acq_physio.status_code == 200
        data_physio = acq_physio.json()
        assert data_physio["status"] == "ACQUISITION_SUCCESS"
        assert data_physio["subject_count"] >= 3
        assert data_physio["split_summary"]["subject_leakage_status"] == "PASSED_ZERO_LEAKAGE"

        # 4. Check Dataset Registry Table
        reg_res = await ac.get("/api/v1/datasets/registry")
        assert reg_res.status_code == 200
        registered = reg_res.json()
        assert len(registered) >= 2

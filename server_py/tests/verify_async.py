"""
PR D Verification — Async concurrency test for voice_router.

Simulates N concurrent requests to /voice/evaluate and verifies that
/health remains responsive throughout (event loop not blocked).

Usage:
    python server_py/tests/verify_async.py

Requires the backend server to be running:
    uvicorn server_py.main:app --host 127.0.0.1 --port 8000
"""
import asyncio
import time
import httpx
import sys
import os

BASE_URL = os.getenv("TEST_BASE_URL", "http://127.0.0.1:8000")
CONCURRENT_REQUESTS = 10
HEALTH_CHECK_INTERVAL = 0.5  # seconds


async def health_check_loop(stop_event: asyncio.Event, results: list):
    """Continuously poll /health until told to stop, recording latency."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=5.0) as client:
        while not stop_event.is_set():
            t0 = time.perf_counter()
            try:
                resp = await client.get("/health")
                latency_ms = (time.perf_counter() - t0) * 1000
                results.append({"status": resp.status_code, "latency_ms": latency_ms})
                if resp.status_code != 200:
                    print(f"  [WARNING] /health returned {resp.status_code}")
                elif latency_ms > 500:
                    print(f"  [WARNING] /health latency high: {latency_ms:.1f}ms (event loop may be blocked)")
            except Exception as e:
                results.append({"status": "error", "error": str(e)})
                print(f"  [ERROR] /health check failed: {e}")
            await asyncio.sleep(HEALTH_CHECK_INTERVAL)


async def fire_dummy_voice_request(client: httpx.AsyncClient, idx: int) -> dict:
    """
    Attempts a POST to /voice/evaluate with a dummy form payload.
    Expected: 422 (validation error) or 401 (auth required) — NOT a hang.
    """
    t0 = time.perf_counter()
    try:
        resp = await client.post(
            "/voice/evaluate",
            files={"file": ("test.webm", b"dummy_audio_bytes", "audio/webm")},
        )
        return {
            "idx": idx,
            "status": resp.status_code,
            "latency_ms": (time.perf_counter() - t0) * 1000,
        }
    except httpx.TimeoutException:
        return {"idx": idx, "status": "timeout", "latency_ms": (time.perf_counter() - t0) * 1000}
    except Exception as e:
        return {"idx": idx, "status": "error", "error": str(e)}


async def run():
    print(f"\n{'='*60}")
    print(f"Async Concurrency Verification — Voice Router")
    print(f"Backend: {BASE_URL}  |  Concurrent requests: {CONCURRENT_REQUESTS}")
    print(f"{'='*60}\n")

    # Check backend is up first
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=5.0) as check:
            r = await check.get("/health")
            print(f"[OK] Backend is running — /health returned {r.status_code}\n")
    except Exception as e:
        print(f"[FAIL] Cannot reach backend at {BASE_URL}: {e}")
        print("Ensure the server is running: uvicorn server_py.main:app --host 127.0.0.1 --port 8000")
        sys.exit(1)

    stop_event = asyncio.Event()
    health_results: list = []

    # Start background health checker
    health_task = asyncio.create_task(health_check_loop(stop_event, health_results))

    # Fire concurrent voice requests
    print(f"Firing {CONCURRENT_REQUESTS} concurrent requests to /voice/evaluate...")
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        tasks = [fire_dummy_voice_request(client, i) for i in range(CONCURRENT_REQUESTS)]
        voice_results = await asyncio.gather(*tasks)

    # Stop health checker
    stop_event.set()
    await health_task

    # Print voice results
    print("\n[Voice Request Results]")
    for r in voice_results:
        status = r.get("status")
        latency = r.get("latency_ms", 0)
        print(f"  Request #{r['idx']}: status={status} latency={latency:.1f}ms")

    # Analyze health results
    print(f"\n[Health Check Results — {len(health_results)} checks]")
    if health_results:
        latencies = [r["latency_ms"] for r in health_results if isinstance(r.get("latency_ms"), float)]
        errors = [r for r in health_results if r.get("status") == "error" or r.get("status", 200) != 200]
        high_latency = [l for l in latencies if l > 500]

        if latencies:
            avg = sum(latencies) / len(latencies)
            max_lat = max(latencies)
            print(f"  Average: {avg:.1f}ms | Max: {max_lat:.1f}ms")

        if errors:
            print(f"  [WARNING] {len(errors)} /health errors — event loop may have blocked!")
        elif high_latency:
            print(f"  [WARNING] {len(high_latency)} health checks had >500ms latency!")
        else:
            print("  [PASS] /health remained responsive throughout all concurrent voice requests.")
    else:
        print("  No health check data collected.")

    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(run())

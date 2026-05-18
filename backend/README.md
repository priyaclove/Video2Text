# Video2Text Backend

Thin Python wrapper that takes a YouTube URL, queues a job, runs the AI
processing script in a background worker, and serves the resulting guide
file back to the frontend.

## Architecture

```
Next.js frontend
      │  POST /jobs { url }
      ▼
FastAPI (uvicorn)
      │  enqueue
      ▼
Redis (RQ queue)
      │
      ▼
RQ worker  →  runs `tasks.process_video(...)`
      │
      ▼
Output file in ./storage/<job_id>/
```

Right now `tasks.process_video` is a **stub** that sleeps 5 seconds and
writes a placeholder PDF. We'll swap it for the client-provided Python
script once we have it.

## Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI app and routes |
| `queue_conn.py` | Redis connection + RQ queue setup |
| `tasks.py` | Job functions (the stub for now) |
| `worker.py` | RQ worker entrypoint |
| `requirements.txt` | Python deps |
| `.env.example` | Template for `.env` |

## One-time setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Running it (three terminals)

```bash
# Terminal 1 — Redis
brew services start redis        # or: redis-server

# Terminal 2 — FastAPI
cd backend && source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 3 — Worker
cd backend && source .venv/bin/activate
python worker.py
```

## Quick smoke test

```bash
# Create a job
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
# → {"job_id":"<id>", "status":"queued"}

# Poll status (run a few times)
curl http://localhost:8000/jobs/<id>
# → {"status":"queued"} → "started" → "finished"

# Download the resulting file
curl http://localhost:8000/jobs/<id>/download -o guide.pdf
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + Redis connectivity |
| `POST` | `/jobs` | Enqueue a YouTube URL, returns `job_id` |
| `GET` | `/jobs/{job_id}` | Poll job status |
| `GET` | `/jobs/{job_id}/download` | Download the result file (only when status is `finished`) |

## Swapping in the client's script

When the client's Python script arrives, edit `tasks.process_video` to
invoke it instead of the stub. The simplest pattern:

```python
import subprocess

def process_video(job_id: str, youtube_url: str) -> dict:
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        ["python", "client_script.py", youtube_url, str(job_dir)],
        check=True,
    )

    return {
        "youtube_url": youtube_url,
        "output_file": str(job_dir / "guide.pdf"),
        "filename": "guide.pdf",
    }
```

The exact call depends on the script's CLI — we'll adjust once we see it.

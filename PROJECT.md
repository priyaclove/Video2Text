# Video2Text — Project Overview

A one-file map of the whole project. What it does, how it's wired, what each
file is for, what works, what's stubbed, and what's next.

App name is **Video2Text** (placeholder — change in `frontend/app/lib/branding.ts`).

---

## 1. What this project is

A web app that takes a YouTube installation/tutorial video and produces a
professional step-by-step installation guide as a PDF or DOCX.

**The client's complaint about previous attempts:**
- The AI was reading the transcript instead of *watching* the video.
- Screenshots didn't match the instructions.
- Steps were duplicated.
- Output looked unprofessional.

So our pipeline must **visually understand the video** (TwelveLabs), write the
steps from that visual understanding (Gemini / Claude), and use Whisper only
as a supporting input. The client is providing the actual AI script — our job
is the **web shell around it** (URL submission, queue, status, file download).

---

## 2. The big picture

```
   Browser (Next.js)
        │  POST /jobs { url }
        ▼
   FastAPI (Python web server, port 8000)
        │  enqueue
        ▼
   Redis (the queue)
        │
        ▼
   RQ Worker
        │  runs tasks.process_video(job_id, url)
        │  → eventually: subprocess the client's Python script
        ▼
   Output file in backend/storage/<job_id>/
        ▲
        │
   Browser polls GET /jobs/{id} every 1.5s
        │  when status="finished", download via GET /jobs/{id}/download
        ▼
   guide.pdf saved to user's Downloads
```

Why a queue? AI video processing takes minutes. If we did it inside the HTTP
request, the browser would time out. The queue lets us return a `job_id`
immediately and process in the background.

---

## 3. Tech stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind v4, TypeScript | Modern stack; App Router for server components + streaming |
| Backend HTTP | FastAPI + uvicorn | Standard Python async web framework |
| Queue | Redis + RQ (Redis Queue) | RQ is simpler than Celery for "run this function" use case |
| AI / video (future, inside client's script) | TwelveLabs, Gemini or Claude, Whisper, yt-dlp, ffmpeg | Per client spec |
| Document export (future, inside client's script) | python-docx, reportlab / weasyprint | Standard Python doc libs |

Versions installed today:
- Node from `frontend/package.json`: Next.js 16.2.6, React 19.2.4, Tailwind 4
- Python 3.12.13
- Redis 8.6.3
- ffmpeg 8.1.1

---

## 4. Repo layout (every folder and file)

```
video2text/
├── frontend/                      ← Next.js app
│   ├── app/
│   │   ├── layout.tsx             Root layout — fonts (Geist, JetBrains Mono), dark theme, suppressHydrationWarning
│   │   ├── page.tsx               Landing page — TopNav, Hero (renders <UrlGenerator/>), FeatureBento, CTA, Footer
│   │   ├── globals.css            Tailwind import + design tokens (@theme) + .glass-card / .ai-glow utilities
│   │   ├── favicon.ico
│   │   ├── components/
│   │   │   ├── icons.tsx          Inline SVG icons (PlayCircle, CheckCircle, Visibility, ScreenshotRegion, AutoAwesome, PdfFile)
│   │   │   └── UrlGenerator.tsx   ★ "use client" — form + 1.5s polling + idle/submitting/polling/done/error states
│   │   └── lib/
│   │       └── branding.ts        APP_NAME / APP_TAGLINE / APP_DESCRIPTION constants
│   ├── public/                    Static assets (favicons, default Next.js SVGs)
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── next-env.d.ts
│   └── node_modules/              (gitignored)
│
├── backend/                       ← Python API + worker
│   ├── main.py                    FastAPI app — /health, POST /jobs, GET /jobs/{id}, GET /jobs/{id}/download + CORS
│   ├── queue_conn.py              Redis connection + RQ Queue("video_jobs"). Named queue_conn to avoid stdlib `queue` clash
│   ├── tasks.py                   ★ process_video(job_id, url) — currently a STUB (sleeps 5s, writes fake PDF bytes)
│   ├── worker.py                  RQ worker entrypoint — listens on the "video_jobs" queue
│   ├── requirements.txt           fastapi, uvicorn, pydantic, python-dotenv, rq, redis
│   ├── .env.example               Template: REDIS_URL, STORAGE_DIR, FRONTEND_ORIGIN, AI keys
│   ├── README.md                  Backend-specific run instructions
│   ├── .venv/                     (gitignored) Python virtual environment
│   └── storage/                   (gitignored) Job outputs land here as backend/storage/<job_id>/guide.pdf
│
├── AGENTS.md                      Repo-wide AI agent instructions (read Next.js docs before assuming APIs)
├── CLAUDE.md                      Imports AGENTS.md
├── README.md                      Default create-next-app README (untouched)
├── PROJECT.md                     ← this file
├── .gitignore                     Node + Python + monorepo ignore rules
└── .git/
```

Files marked **★** are the ones you'll touch most often.

---

## 5. How a job flows through the system

Step by step, what happens when a user clicks **Generate Installation Guide**:

1. **Browser**: `UrlGenerator.handleSubmit` fires. State → `submitting`. Sends:
   ```
   POST http://localhost:8000/jobs
   Content-Type: application/json

   { "url": "https://www.youtube.com/watch?v=..." }
   ```

2. **FastAPI** (`main.py:create_job`): generates a UUID, calls
   `job_queue.enqueue(process_video, job_id, url, job_id=job_id)`, returns
   `{ "job_id": "<uuid>", "status": "queued", "download_url": null }`.

3. **Redis**: the job (function reference + args) is serialised and pushed onto
   the `video_jobs` queue.

4. **Browser**: state → `polling`. Starts a `setInterval` that hits
   `GET /jobs/{id}` every 1.5 seconds.

5. **Worker** (`worker.py`): picks up the job, calls
   `tasks.process_video(job_id, url)`. Currently the stub sleeps 5s and writes
   a 41-byte placeholder to `backend/storage/<job_id>/guide.pdf`. The function
   returns a dict that RQ stores as the job result.

6. **Browser polling**: sees status flip `queued → started → finished`. When
   `finished`, stops polling, switches state to `done`, shows the **Download
   Guide** button pointing at `GET /jobs/{id}/download`.

7. **FastAPI** (`main.py:download_job`): reads the result dict from Redis,
   resolves `output_file`, returns it as a `FileResponse` with filename
   `guide.pdf`.

If anything throws, status flips to `failed`, the worker stores the exception
in the job record, and the browser shows the error message with a **Try again**
button.

---

## 6. API endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/health` | Liveness + Redis connectivity | `{"status":"ok","redis":true}` |
| `POST` | `/jobs` | Enqueue a URL | `{job_id, status, download_url, error}` |
| `GET` | `/jobs/{job_id}` | Poll job status | same shape; `download_url` populated when finished |
| `GET` | `/jobs/{job_id}/download` | Download result file | binary PDF/DOCX (only when finished) |

CORS: `main.py` allows the origin in `FRONTEND_ORIGIN` env var (default
`http://localhost:3000`).

---

## 7. Running it locally — three terminals

**One-time setup** (already done on this machine):
```bash
brew install python@3.12 redis ffmpeg
brew services start redis

cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # optional — defaults work for local dev
```

**Every dev session:**

```bash
# Terminal 1 — Next.js frontend (http://localhost:3000)
cd frontend
npm run dev

# Terminal 2 — FastAPI backend (http://localhost:8000)
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 3 — RQ worker
cd backend
source .venv/bin/activate
python worker.py
```

Redis runs in the background via `brew services start redis` — no terminal
needed for it.

Stop everything:
```bash
# Ctrl+C in each terminal
brew services stop redis   # optional
```

---

## 8. Configuration (env vars)

`backend/.env` (copy from `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string for the queue |
| `STORAGE_DIR` | `./storage` | Where job outputs land (`backend/storage/<job_id>/`) |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowlist |
| `TWELVELABS_API_KEY` | (empty) | Used by the future client script |
| `GEMINI_API_KEY` | (empty) | Used by the future client script |
| `ANTHROPIC_API_KEY` | (empty) | Used by the future client script |
| `OPENAI_API_KEY` | (empty) | Used by the future client script |

Frontend (optional): `frontend/.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8000` | Where `UrlGenerator` sends requests |

---

## 9. Current state — what works, what's stubbed

### ✅ Works

- Landing page UI (matches Stitch mockup): nav, hero, feature bento, CTA, footer.
- URL form: validation, submit, disable-while-busy, polling, friendly status labels.
- FastAPI: all 4 endpoints, CORS, env-var config, error handling.
- Redis queue + RQ worker: jobs are enqueued, picked up, executed, results stored.
- End-to-end smoke test: POST → wait → GET shows finished → download returns a file.

### ⚠️ Stubbed (intentional — replace later)

- **`backend/tasks.py:process_video`** sleeps 5 seconds and writes a 41-byte
  placeholder PDF. Chrome's PDF viewer will show **"Failed to load PDF
  document"** — this is expected, the bytes are not a real PDF.
- AI service keys in `.env.example` are blank. The stub doesn't need them; the
  real script will.

### ❌ Not yet built

- The client's actual AI script is not in this repo yet.
- Processing-page UI (Stitch mockup `guideforge_ai_processing.../`) — not started.
- Result-page UI (Stitch mockup `guideforge_ai_result/`) — not started.
- DOCX export endpoint (only PDF path is stubbed).
- Authentication, user accounts, history dashboard — out of scope for v0.

---

## 10. Where the client's script plugs in

Open `backend/tasks.py`. Replace the body of `process_video` with a call to
the client's script. The shape depends on how the script is invoked — three
common patterns:

**Pattern A — script is a CLI:**
```python
import subprocess

def process_video(job_id: str, youtube_url: str) -> dict:
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["python", "/path/to/client_script.py", youtube_url, str(job_dir)],
        check=True,
    )
    return {"output_file": str(job_dir / "guide.pdf"), "filename": "guide.pdf"}
```

**Pattern B — script exposes a function:**
```python
from client_script import generate_guide

def process_video(job_id: str, youtube_url: str) -> dict:
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    output_path = generate_guide(youtube_url, job_dir)
    return {"output_file": str(output_path), "filename": output_path.name}
```

**Pattern C — script returns a buffer / inline bytes:** rare, but if so we'd
write the bytes ourselves to `job_dir/guide.pdf`.

The exact form depends on the script we receive. The contract our backend
needs is: **inputs `(youtube_url, output_dir)` → produces a file we can serve**.

---

## 11. Design decisions worth remembering

- **Monorepo, not split repos.** `frontend/` + `backend/` siblings, one git repo.
- **RQ over Celery.** Simpler API; we don't need Celery's advanced features.
- **Subprocess pattern preferred.** Treats the client's script as a black box —
  no need to read or refactor it.
- **`queue_conn.py` not `queue.py`.** Python's stdlib has a `queue` module;
  naming our file `queue` would shadow it.
- **Stub-first.** The whole pipeline works with a fake job, so frontend ↔
  backend ↔ queue ↔ worker plumbing is verified before paying for AI calls.
- **App name lives in one place** (`frontend/app/lib/branding.ts`) — rename in
  one line.
- **Icons are inline SVG**, not an icon font. Reliable, no external network
  load, no FOUT issues. (We tried Material Symbols via Google Fonts CDN first —
  it kept failing to load.)

---

## 12. Common gotchas

| Problem | Cause | Fix |
|---|---|---|
| "Failed to load PDF document" in Chrome | The stub produces fake PDF bytes | Expected — until client script lands |
| `Could not reach backend` in the UI | FastAPI not running or wrong port | Start uvicorn on 8000; check `NEXT_PUBLIC_BACKEND_URL` |
| Worker silent / jobs stay `queued` | Worker process not started | Run `python worker.py` in a third terminal |
| `connection refused` on Redis | Redis not running | `brew services start redis` |
| `Port 3000 is in use` | Another `next dev` is already running | Kill it: `lsof -ti :3000 \| xargs kill` |
| `Module 'queue' has no attribute ...` | Tried to use `queue` as our package name | Use `queue_conn` (already done) |
| Hydration mismatch on `<body>` | Browser extension (ColorZilla) adds `cz-shortcut-listen` | `<body suppressHydrationWarning>` (already set) |

---

## 13. Git state

- Remote: `https://github.com/priyaclove/Video2Text.git`
- Branch: `main`
- Commits so far: 1 (`Initial commit from Create Next App`)
- Uncommitted changes: **everything described in this doc** is currently
  uncommitted. By user instruction, nothing is committed without explicit
  approval.

To check current state:
```bash
git status
```

---

## 14. What's next (in suggested order)

1. **Plug in the client's Python script** when it arrives — edit `tasks.py`
   per one of the three patterns in §10.
2. **Switch the stub PDF to a real one** in the meantime if useful (one
   `reportlab` call), so the download demo doesn't look broken.
3. **Build the Processing page** (Stitch mockup
   `guideforge_ai_processing.../code.html`) — show step-by-step progress
   instead of a single spinner.
4. **Build the Result page** (Stitch mockup `guideforge_ai_result/code.html`)
   — preview the guide before download.
5. **Add a `/jobs/{id}/download.docx` endpoint** once the client's script
   produces DOCX too.
6. **Commit + push** to GitHub. (Awaiting user go-ahead.)
7. **Deploy** — likely DigitalOcean per spec. Frontend can be Vercel for free
   tier; backend + Redis + worker need a Linux box with ffmpeg installed.

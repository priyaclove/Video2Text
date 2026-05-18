<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. The Next.js app lives in `frontend/`; read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing frontend code. Heed deprecation notices.

# Backend lives in `backend/`

Python FastAPI app with an RQ worker for queued video-processing jobs. Run it via the steps in `backend/README.md`. The actual AI/video pipeline is wrapped from a client-provided script — do not reinvent it.
<!-- END:nextjs-agent-rules -->

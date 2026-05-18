import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from rq.job import Job
from rq.exceptions import NoSuchJobError

from queue_conn import job_queue, redis_conn
from tasks import process_video

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage")).resolve()

app = FastAPI(title="Video2Text API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class CreateJobRequest(BaseModel):
    url: HttpUrl


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    download_url: str | None = None
    error: str | None = None


@app.get("/health")
def health():
    try:
        redis_conn.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {"status": "ok", "redis": redis_ok}


@app.post("/jobs", response_model=JobStatusResponse)
def create_job(body: CreateJobRequest):
    job_id = uuid.uuid4().hex
    job_queue.enqueue(
        process_video,
        job_id,
        str(body.url),
        job_id=job_id,
        job_timeout=60 * 30,
    )
    return JobStatusResponse(job_id=job_id, status="queued")


@app.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except NoSuchJobError:
        raise HTTPException(status_code=404, detail="Job not found")

    status = job.get_status(refresh=True)

    download_url = None
    error = None
    if status == "finished":
        download_url = f"/jobs/{job_id}/download"
    elif status == "failed":
        error = str(job.exc_info or "unknown error")

    return JobStatusResponse(
        job_id=job_id,
        status=status,
        download_url=download_url,
        error=error,
    )


@app.get("/jobs/{job_id}/download")
def download_job(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except NoSuchJobError:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get_status(refresh=True) != "finished":
        raise HTTPException(status_code=409, detail="Job not finished")

    result = job.result or {}
    output_file = result.get("output_file")
    filename = result.get("filename", "guide.pdf")
    if not output_file or not Path(output_file).is_file():
        raise HTTPException(status_code=500, detail="Output file missing")

    return FileResponse(output_file, filename=filename)

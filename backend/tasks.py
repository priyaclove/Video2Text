import os
import time
from pathlib import Path

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage")).resolve()


def process_video(job_id: str, youtube_url: str) -> dict:
    """
    Stub job. Pretends to process a YouTube URL into an installation guide.

    Replace the body of this function with a call to the client-provided
    Python script once we have it (e.g. via subprocess.run).
    """
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    time.sleep(5)

    fake_pdf = job_dir / "guide.pdf"
    fake_pdf.write_bytes(
        b"%PDF-1.4\n% Fake placeholder guide.\n%%EOF\n"
    )

    return {
        "youtube_url": youtube_url,
        "output_file": str(fake_pdf),
        "filename": "guide.pdf",
    }

import asyncio
import shutil
import uuid
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from pipeline.image_generator import generate_images
from pipeline.script_generator import generate_script
from pipeline.tts_generator import generate_tts
from pipeline.video_composer import compose_video

TMP_ROOT = Path("/tmp")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env.local")
load_dotenv(PROJECT_ROOT / ".env")
JobState = Literal["pending", "processing", "done", "error"]
JobStep = Literal["script", "tts", "images", "video"]


class GenerateRequest(BaseModel):
    topic: str = Field(min_length=3)
    language: Literal["it", "en"] = "it"
    voice: Literal["male", "female"] = "male"


class GenerateResponse(BaseModel):
    job_id: str


class JobStatus(BaseModel):
    status: JobState = "pending"
    current_step: JobStep | None = None
    progress: int = 0
    error: str | None = None
    title: str | None = None


app = FastAPI(title="AI Shorts Generator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: dict[str, JobStatus] = {}


def _set_status(job_id: str, *, step: JobStep | None, progress: int, status: JobState = "processing", error: str | None = None, title: str | None = None) -> None:
    current = jobs[job_id]
    jobs[job_id] = JobStatus(
        status=status,
        current_step=step,
        progress=progress,
        error=error,
        title=title if title is not None else current.title,
    )


async def _cleanup_job(job_id: str, delay_seconds: int = 3600) -> None:
    await asyncio.sleep(delay_seconds)
    shutil.rmtree(TMP_ROOT / job_id, ignore_errors=True)
    jobs.pop(job_id, None)


async def _run_pipeline(job_id: str, request: GenerateRequest) -> None:
    job_dir = TMP_ROOT / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        _set_status(job_id, step="script", progress=5)
        script = await generate_script(request.topic, request.language)
        _set_status(job_id, step="script", progress=20, title=script.get("title"))

        _set_status(job_id, step="tts", progress=25)
        await generate_tts(script, request.voice, request.language, job_dir)
        _set_status(job_id, step="tts", progress=40)

        _set_status(job_id, step="images", progress=45)
        await generate_images(script, job_dir)
        _set_status(job_id, step="images", progress=65)

        _set_status(job_id, step="video", progress=72)
        await compose_video(script, job_dir)
        _set_status(job_id, step="video", progress=100, status="done", title=script.get("title"))
    except Exception as exc:
        _set_status(job_id, step=jobs[job_id].current_step, progress=jobs[job_id].progress, status="error", error=str(exc))
    finally:
        asyncio.create_task(_cleanup_job(job_id))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    job_id = str(uuid.uuid4())
    jobs[job_id] = JobStatus(status="pending", current_step="script", progress=0)
    asyncio.create_task(_run_pipeline(job_id, request))
    return GenerateResponse(job_id=job_id)


@app.get("/status/{job_id}", response_model=JobStatus)
async def status(job_id: str) -> JobStatus:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job non trovato.")
    return job


@app.get("/download/{job_id}")
async def download(job_id: str) -> FileResponse:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job non trovato.")
    if job.status != "done":
        raise HTTPException(status_code=400, detail="Video non ancora pronto.")

    output_path = TMP_ROOT / job_id / "output.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="File video non trovato.")

    safe_title = (job.title or job_id).replace(" ", "-").lower()
    return FileResponse(path=output_path, media_type="video/mp4", filename=f"{safe_title}.mp4")

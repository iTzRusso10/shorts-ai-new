import asyncio
from pathlib import Path


async def _run_ffmpeg(args: list[str], cwd: Path | None = None) -> None:
    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-y",
        *args,
        cwd=str(cwd) if cwd else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _stdout, stderr = await process.communicate()
    if process.returncode != 0:
        raise RuntimeError(stderr.decode("utf-8", errors="ignore") or "FFmpeg non riuscito.")


async def compose_video(script: dict, job_dir: Path) -> Path:
    clips: list[Path] = []

    for scene in script.get("scenes", []):
        scene_id = scene["id"]
        image_path = job_dir / f"scene_{scene_id}.png"
        clip_path = job_dir / f"clip_{scene_id}.mp4"
        duration = str(float(scene.get("duration", 5.0)))

        await _run_ffmpeg([
            "-loop", "1",
            "-t", duration,
            "-i", str(image_path),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
            "-c:v", "libx264",
            "-preset", "fast",
            "-r", "30",
            str(clip_path),
        ])
        clips.append(clip_path)

    filelist_path = job_dir / "filelist.txt"
    filelist_path.write_text("".join(f"file '{clip.name}'\n" for clip in clips), encoding="utf-8")

    audio_path = job_dir / "audio.wav"
    output_path = job_dir / "output.mp4"
    video_filter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    ffmpeg_args = [
        "-f", "concat",
        "-safe", "0",
        "-i", str(filelist_path),
        "-i", str(audio_path),
        "-vf", video_filter,
    ]

    ffmpeg_args.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-shortest",
        str(output_path),
    ])

    await _run_ffmpeg(ffmpeg_args, cwd=job_dir)

    return output_path

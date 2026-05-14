import asyncio
import os
from pathlib import Path

from google import genai
from google.genai import types

IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
FALLBACK_IMAGE_MODEL = os.getenv("GEMINI_FALLBACK_IMAGE_MODEL", "imagen-4.0-fast-generate-001")
MAX_CONCURRENT_IMAGE_REQUESTS = 1


def _sanitize_visual_brief(value: str) -> str:
    blocked_terms = [
        "text",
        "caption",
        "subtitle",
        "subtitles",
        "title",
        "words",
        "letters",
        "numbers",
        "sign",
        "signs",
        "label",
        "labels",
        "poster",
        "speech bubble",
        "white box",
        "text box",
        "logo",
        "watermark",
        "ui",
        "infographic",
    ]
    sanitized = value
    for term in blocked_terms:
        sanitized = sanitized.replace(term, "")
        sanitized = sanitized.replace(term.title(), "")
        sanitized = sanitized.replace(term.upper(), "")
    return " ".join(sanitized.split())


def _save_image_response(response, output_path: Path) -> None:
    text_parts: list[str] = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            text = getattr(part, "text", None)
            if text:
                text_parts.append(text)
            inline_data = getattr(part, "inline_data", None)
            if inline_data and getattr(inline_data, "data", None):
                output_path.write_bytes(inline_data.data)
                return
    details = " ".join(text_parts).strip()
    if details:
        raise RuntimeError(f"Nano Banana non ha restituito dati immagine. Risposta: {details}")
    raise RuntimeError("Nano Banana non ha restituito dati immagine.")


def _save_generated_image_response(response, output_path: Path) -> None:
    for generated_image in getattr(response, "generated_images", []) or []:
        image = getattr(generated_image, "image", None)
        image_bytes = getattr(image, "image_bytes", None)
        if image_bytes:
            output_path.write_bytes(image_bytes)
            return
    raise RuntimeError("Fallback Imagen non ha restituito dati immagine.")


async def _generate_one(client: genai.Client, semaphore: asyncio.Semaphore, scene: dict, job_dir: Path) -> Path:
    output_path = job_dir / f"scene_{scene['id']}.png"
    speech_text = str(scene.get("speech_text", "")).strip()
    image_prompt = _sanitize_visual_brief(str(scene.get("image_prompt", "")).strip())
    prompt = (
        "Generate exactly one original image. Do not answer with text. "
        "CRITICAL: the final image must contain ZERO readable text. "
        "Do not render any words, letters, numbers, captions, subtitles, title cards, white text boxes, signs, labels, posters, UI elements, speech bubbles, logos, or watermarks. "
        "If the narration is a question or a quote, show the visual situation only and never write the sentence in the image. "
        "The image must visually match the narration line below, not the general topic. "
        f"NARRATION LINE: {speech_text}. "
        f"VISUAL BRIEF: {image_prompt}. "
        "Show one clear concrete subject doing a visible action in a coherent setting. "
        "Avoid generic symbolism, abstract concepts, charts, icons, typography, written overlays, or unrelated objects. "
        "NEGATIVE PROMPT: text, caption, subtitle, title, white rounded rectangle, speech bubble, sign, poster, label, logo, watermark, letters, numbers, UI, infographic. "
        "Vertical 9:16 portrait composition for a social media short, photorealistic cinematic lighting, high quality."
    )
    async with semaphore:
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=IMAGE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=[types.Modality.TEXT, types.Modality.IMAGE],
                ),
            )
            _save_image_response(response, output_path)
        except Exception as nano_error:
            try:
                fallback_response = await asyncio.to_thread(
                    client.models.generate_images,
                    model=FALLBACK_IMAGE_MODEL,
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio="9:16",
                        output_mime_type="image/png",
                    ),
                )
                _save_generated_image_response(fallback_response, output_path)
            except Exception as fallback_error:
                raise RuntimeError(f"Nano Banana fallito: {nano_error}. Fallback Imagen fallito: {fallback_error}") from fallback_error
    return output_path


async def generate_images(script: dict, job_dir: Path) -> list[Path]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY non configurata.")

    client = genai.Client(api_key=api_key)
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_IMAGE_REQUESTS)
    scenes = script.get("scenes") or []
    return await asyncio.gather(*[_generate_one(client, semaphore, scene, job_dir) for scene in scenes])

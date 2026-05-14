import asyncio
import base64
import os
import wave
from pathlib import Path

from google import genai
from google.genai import types


def _extract_audio(response) -> tuple[bytes, str | None]:
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            inline_data = getattr(part, "inline_data", None)
            if inline_data and getattr(inline_data, "data", None):
                data = inline_data.data
                if isinstance(data, str):
                    data = base64.b64decode(data)
                return data, getattr(inline_data, "mime_type", None)
    raise RuntimeError("Gemini TTS non ha restituito audio.")


def _write_audio_file(audio_path: Path, audio_data: bytes, mime_type: str | None) -> None:
    if mime_type and ("wav" in mime_type or "mpeg" in mime_type or "mp3" in mime_type):
        audio_path.write_bytes(audio_data)
        return

    with wave.open(str(audio_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(24000)
        wav_file.writeframes(audio_data)


async def generate_tts(script: dict, voice: str, language: str, job_dir: Path) -> Path:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY non configurata.")

    client = genai.Client(api_key=api_key)
    voice_name = "Charon" if voice == "male" else "Aoede"
    speech_text = " ".join(scene.get("speech_text", "") for scene in script.get("scenes", [])).strip()
    if not speech_text:
        raise ValueError("Nessun testo parlato disponibile per il TTS.")

    prompt = f"Read this {language} voiceover:\n\n{speech_text}"
    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-2.5-flash-preview-tts",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name,
                    ),
                ),
            ),
        ),
    )
    audio_path = job_dir / "audio.wav"
    audio_data, mime_type = _extract_audio(response)
    _write_audio_file(audio_path, audio_data, mime_type)
    return audio_path

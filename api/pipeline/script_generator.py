import asyncio
import json
import os
import re

import google.generativeai as genai

SYSTEM_PROMPT = """Sei un esperto di content creation per social media e visual direction. Genera uno script per un video short di massimo 60 secondi sul topic fornito.
Genera da 8 a 12 scene, ognuna di durata 3-5 secondi, così il video cambia immagine spesso.
Ogni scena deve avere uno speech_text breve e un image_prompt diverso, specifico e visivo.
Regola fondamentale: l'image_prompt deve rappresentare ESATTAMENTE ciò che viene detto nello speech_text della stessa scena, non il topic generale.
Per ogni image_prompt includi:
- soggetto principale concreto
- azione o situazione visibile
- contesto/ambientazione coerente
- emozione o atmosfera
- stile fotografico realistico verticale
Evita immagini generiche, simboliche o scollegate.
Regola critica per le immagini: l'image_prompt NON deve mai chiedere o implicare testo visibile nell'immagine.
Vietati: scritte, parole, lettere, numeri, sottotitoli, caption, cartelli, poster, etichette, speech bubble, UI, box bianchi con testo, loghi, watermark, grafici o infografiche.
Se lo speech_text contiene una domanda o una frase citabile, rappresenta la situazione visivamente senza inserire la frase nell'immagine.

Restituisci SOLO JSON valido, nessun testo extra:
{
  "title": "titolo del video",
  "total_duration": 45,
  "scenes": [
    {
      "id": 1,
      "start_time": 0.0,
      "duration": 5.0,
      "speech_text": "testo parlato in questa scena",
      "image_prompt": "English prompt that visually depicts this exact speech_text only, with concrete subject, action, setting, mood, photorealistic vertical cinematic style. Absolutely no visible text, no captions, no signs, no labels, no words, no letters, no numbers, no UI, no speech bubbles"
    }
  ]
}
"""


def _extract_json(text: str) -> dict:
    cleaned = text.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _validate_script(script: dict) -> dict:
    if not script.get("title"):
        raise ValueError("Lo script non contiene un titolo.")
    if not script.get("scenes"):
        raise ValueError("Lo script non contiene scene.")
    for scene in script.get("scenes", []):
        if not scene.get("speech_text"):
            raise ValueError("Una scena non contiene speech_text.")
        if not scene.get("image_prompt"):
            raise ValueError("Una scena non contiene image_prompt.")
    return script


async def generate_script(topic: str, language: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY non configurata.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-3.1-flash-lite",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json"},
    )
    prompt = (
        f"Topic: {topic}\n"
        f"Lingua output: {language}\n"
        "Durata: 30-60 secondi\n"
        "Formato: short verticale social\n"
        "Numero scene: 8-12\n"
        "Durata per scena: 3-5 secondi\n"
        "Priorità massima: ogni image_prompt deve essere strettamente aderente al relativo speech_text della stessa scena.\n"
        "Non inserire mai testo visibile dentro gli image_prompt: niente scritte, caption, cartelli, parole, lettere o box testo."
    )

    response = await asyncio.to_thread(model.generate_content, prompt)
    text = getattr(response, "text", "")
    if not text:
        raise RuntimeError("Gemini non ha restituito testo per lo script.")

    return _validate_script(_extract_json(text))

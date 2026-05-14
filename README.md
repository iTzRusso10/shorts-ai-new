# AI Shorts Generator

Web app full-stack per generare automaticamente video short verticali 9:16 con script AI, voiceover, immagini AI e sottotitoli bruciati nel video.

## Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS
- **Backend:** Python FastAPI in `/api`
- **AI:** Google Gemini / Nano Banana
- **Video:** FFmpeg via subprocess async
- **Storage:** `/tmp/{job_id}` con cleanup automatico dopo 1 ora

## Requisiti

- Node.js 18+
- Python 3.11+
- FFmpeg installato e disponibile nel `PATH`
- Una API key Gemini valida

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Compila `.env.local`:

```bash
GEMINI_API_KEY=la_tua_api_key
FASTAPI_URL=http://localhost:8000
```

Setup backend:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r api/requirements.txt
```

## Avvio

Terminale 1, backend FastAPI:

```bash
source .venv/bin/activate
GEMINI_API_KEY=la_tua_api_key uvicorn main:app --reload --host 0.0.0.0 --port 8000 --app-dir api
```

Terminale 2, frontend Next.js:

```bash
npm run dev
```

Apri:

```bash
http://localhost:3000
```

## API backend

### `POST /generate`

Body:

```json
{
  "topic": "I 3 benefici della meditazione",
  "language": "it",
  "voice": "male"
}
```

Response:

```json
{
  "job_id": "uuid"
}
```

### `GET /status/{job_id}`

Response:

```json
{
  "status": "pending",
  "current_step": "script",
  "progress": 0,
  "error": null,
  "title": null
}
```

### `GET /download/{job_id}`

Restituisce `output.mp4` quando il job è completato.

## Pipeline

1. Generazione script con `gemini-2.5-flash`
2. Voiceover con `gemini-2.5-flash-preview-tts`
3. Immagini con `gemini-2.5-flash-image`
4. SRT con word wrap 40 caratteri, massimo 2 righe
5. Composizione FFmpeg in `1080x1920`

## Note

- I job sono salvati in memoria, quindi vengono persi al riavvio del backend.
- I file temporanei sono eliminati dopo 1 ora.
- La API key resta solo lato server/backend e non viene esposta al client.

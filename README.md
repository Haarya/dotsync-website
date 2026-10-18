# DotSync website planning documents

These documents define the first version of the DotSync website and its connection to the existing ESP32 prototype. They are planning references; the APIs and schemas below describe proposed website/backend behavior unless explicitly identified as existing firmware behavior.

## Documents

1. [Product requirements](docs/PRD.md)
2. [Application flow](docs/APP_FLOW.md)
3. [Technology stack](docs/TECH_STACK.md)
4. [Project guidelines](docs/GUIDELINES.md)
5. [Frontend guidelines](docs/FRONTEND_GUIDELINES.md)
6. [Backend schema](docs/BACKEND_SCHEMA.md)
7. [Implementation roadmap](docs/ROADMAP.md)
8. [Phase-by-phase implementation plan](docs/IMPLEMENTATION_PLAN.md)

## Current hardware/software boundary

The supplied integrated firmware exposes HTTP endpoints for A-Z learn mode, a single-letter tactile quiz, three-second microphone recording, WAV retrieval, device status, and simple audio feedback tones. The current Braille cell is one six-dot cell, has no touch sensor, and displays one letter at a time. Speech recognition, word scoring, progress tracking, and production access control belong to future website/backend work.

The integration package says the combined sketch still needs compilation and physical bench validation. Use the package's test and calibration guide before learner sessions. The learner product is limited to English Grade 1 A-Z until broader Braille support is designed.

## Local simulator build

The React + TypeScript frontend and FastAPI backend currently run in mock mode. Letter practice advances through the entered text in a simulator, including a Braille cell preview, progress, stop, and reset controls. The word journey runs through an in-memory session, steps through Braille patterns, and keeps the answer key on the backend. A typed answer exercises the scoring path; the simulator does not record audio or perform speech recognition. The self-guided A-Z lesson gives session-only progress and a simple deterministic revisit choice. No commands are sent to the ESP32.

1. Create and activate a Python virtual environment from the repository root.
2. Install the backend requirements with `python -m pip install -r backend/requirements.txt`.
3. Start the API with `python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000`.
4. In a second terminal, run `cd frontend`, `npm install`, and `npm run dev`.
5. Open the local URL printed by Vite. The frontend proxies `/api` requests to the local backend.

The first development environment needs Node.js 20.19+ or 22.12+ and Python 3.11+. If PowerShell blocks `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`. Mock mode is shown in the page so simulation cannot be mistaken for physical board movement.

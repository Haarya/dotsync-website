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

# DotSync Backend Schema and API Contract

**Status:** Proposed website/backend contract; not implemented in the supplied ESP32 firmware.

## 1. Responsibilities

The backend serves as the trusted coordinator between the browser, the ESP32, and a speech-recognition provider. It owns lesson/session state and the expected quiz answer. The browser never calls the ESP32 directly and receives no answer key before the activity is revealed.

## 2. Data model

MVP is memory-only and stores no child account or audio file beyond the time needed to score a response. These records are proposed for a later local SQLite progress feature.

### `LearnerProfile` (optional, later)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key; opaque, locally generated |
| `display_name` | string, nullable | Optional nickname only; do not require full name |
| `created_at` | ISO-8601 timestamp | Local timestamp with timezone |
| `active` | boolean | Teacher-controlled |

### `Lesson`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | string | Teacher-facing title |
| `mode` | enum | `practice_letters`, `read_word` |
| `items` | JSON array | Supported letters/words; validate against A-Z scope |
| `created_at` | ISO-8601 timestamp | |

### `LearningSession`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `lesson_id` | UUID, nullable | Optional lesson template reference |
| `learner_id` | UUID, nullable | Local pseudonymous profile only |
| `mode` | enum | `practice_letters`, `read_word` |
| `state` | enum | `ready`, `presenting`, `waiting_for_answer`, `recording`, `processing`, `feedback`, `completed`, `cancelled`, `error` |
| `item_index` | integer | Zero-based current item |
| `expected_answer` | string | Server-only field; never serialize to learner response |
| `created_at` | ISO-8601 timestamp | |
| `completed_at` | ISO-8601 timestamp, nullable | |

### `Attempt` (optional, later)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Parent session |
| `transcript` | string, nullable | Do not persist by default; omit or redact unless approved |
| `confidence` | number, nullable | 0.0–1.0 if supported by recognizer |
| `outcome` | enum | `correct`, `retry`, `uncertain`, `recognition_error` |
| `duration_ms` | integer, nullable | Optional aggregate metric |
| `created_at` | ISO-8601 timestamp | |

Raw WAV files are transient. The backend holds them in memory or a temporary file and deletes them in a `finally` cleanup path after scoring.

## 3. Browser-to-backend API (proposed)

Base path: `/api/v1`. JSON over same-origin HTTP in local MVP; deploy behind HTTPS if the app is hosted beyond localhost.

### Device and practice

- `GET /health` → `{ "ok": true }`
- `GET /device/status` → `{ "connected": true, "busy": false, "micRecordingReady": false, "apiVersion": 1 }`
- `POST /practice` body `{ "text": "CAT" }` → `202 { "actionId": "...", "state": "queued" }`
- `POST /device/reset` → `202 { "actionId": "...", "state": "queued" }`
- `GET /actions/{actionId}` → `{ "state": "queued|running|completed|failed", "message": "..." }`

### Quiz session

- `POST /sessions` body `{ "mode": "read_word", "word": "CAT" }` → `201 { "sessionId": "...", "state": "ready", "itemCount": 3 }`
- `POST /sessions/{sessionId}/advance` → `202 { "state": "presenting", "itemIndex": 1, "itemCount": 3 }`. Do not include the target letter or word in learner mode.
- `POST /sessions/{sessionId}/record` → `202 { "state": "recording" }`
- `GET /sessions/{sessionId}` → `{ "sessionId": "...", "state": "waiting_for_answer", "itemIndex": 1, "itemCount": 3 }`
- `POST /sessions/{sessionId}/evaluate` → `{ "outcome": "correct|retry|uncertain", "confidence": 0.91, "feedback": "That’s right. Ready for the next word?" }`
- `POST /sessions/{sessionId}/cancel` → `{ "state": "cancelled" }`

The exact shape may change during implementation. The invariant is that `expected_answer` stays server-side until an explicit teacher reveal.

## 4. ESP32 adapter contract

The `DeviceClient` talks to current form-encoded firmware routes: `GET /api/health`, `GET /api/status`, `POST /api/learn`, `POST /api/quiz/show`, `POST /api/quiz/record`, `GET /api/mic.wav`, `POST /api/quiz/feedback`, and `POST /api/pins/reset`.

- Translate backend actions to current endpoint names and form fields.
- Treat `202` as queued, `409` as busy/retryable, and other non-2xx responses as errors with safe user messages.
- Poll status with bounded timeouts. The firmware may delay responses while a blocking hardware action is running.
- Confirm recording completion before fetching `/api/mic.wav`; WAV is mono PCM16 at 16,000 Hz in the current sketch.
- Keep expected word and scoring entirely in the backend.

## 5. Validation and error model

- Validate A-Z and spaces; reject an empty string and text beyond endpoint limits.
- Limit quiz words to a curated short-word length until recording duration is validated.
- Return consistent errors such as `DEVICE_OFFLINE`, `DEVICE_BUSY`, `UNSUPPORTED_INPUT`, `RECORDING_FAILED`, `TRANSCRIPTION_UNCERTAIN`, and `SESSION_NOT_FOUND`.
- Never return raw WAV bytes, secret service configuration, or `expected_answer` in ordinary learner session responses.
- Handle recognizer failure as `uncertain` or a recoverable error, never as an automatic incorrect answer.

## 6. Persistence and retention

MVP: in-memory session state, no login, no persistent learner profiles, no saved audio. Later SQLite may store pseudonymous profiles, lesson definitions, session outcomes, and aggregate progress only after the team defines access, consent, deletion, and retention policies. Do not store raw voice by default.

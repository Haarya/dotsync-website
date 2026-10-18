# DotSync Website Implementation Plan

**Status:** In progress  
**Version:** 1.0  
**Date:** 2026-10-18

This plan turns the DotSync PRD, application flow, technology stack, project guidelines, frontend guidelines, backend schema, and roadmap into an ordered implementation sequence. The attached project package and firmware define the device boundary; they do not override these website requirements.

## 1. Build objective

Deliver a supervised, local web app for English Grade 1 Braille A-Z practice using the existing ESP32 one-cell prototype. A teacher or learner enters supported practice text in the browser; a local backend coordinates the ESP32. A later guided word activity presents one letter at a time, records the learner saying the word, and gives a cautious result.

The first release does not include touch sensing, display of a whole word at once, accounts, persistent child profiles, cloud audio storage, or public internet control of the ESP32.

## 2. Source-of-truth documents

| Document | How implementation uses it |
|---|---|
| [PRD](PRD.md) | User needs, MVP scope, requirements, success criteria, and release gates |
| [Application flow](APP_FLOW.md) | Screen sequence, session states, and recovery paths |
| [Technology stack](TECH_STACK.md) | Runtime architecture, languages, libraries, and project structure |
| [Project guidelines](GUIDELINES.md) | Product boundaries, accessibility, privacy, and engineering rules |
| [Frontend guidelines](FRONTEND_GUIDELINES.md) | Learner and teacher interface behavior and accessibility |
| [Backend schema](BACKEND_SCHEMA.md) | Proposed browser API, session data, device adapter behavior, and later persistence |
| [Roadmap](ROADMAP.md) | Longer-term learning features, AI, and classroom deployment direction |

If documents conflict with observed firmware behavior, the firmware contract and a verified hardware bench check define what the prototype can do. Website-facing APIs in `BACKEND_SCHEMA.md` are proposed contracts; they are not routes already present in the ESP32.

## 3. Architecture and data formats

```text
React + TypeScript browser
          │ same-origin JSON
          ▼
Python + FastAPI backend on the classroom computer
  ├─ lesson and session state
  ├─ serialized device actions
  ├─ ESP32 HTTP adapter
  └─ speech recognizer interface and answer comparison
          │ HTTP on trusted local Wi-Fi
          ▼
ESP32 firmware → one six-dot cell, speaker, microphone
```

- **Frontend language:** TypeScript. Define request/response and UI state types; validate form input before sending it.
- **Backend language:** Python with type hints and Pydantic models. Keep validation, session state, device calls, and speech recognition in separate modules.
- **Browser ↔ backend:** JSON over same-origin HTTP for the local prototype. The Vite development server proxies `/api` to FastAPI; the production/local package serves the built frontend and API from the local service.
- **Backend ↔ ESP32:** use the current firmware’s HTTP endpoints and `application/x-www-form-urlencoded` fields. Retrieve microphone data as raw `audio/wav` bytes. Do not make the browser call the ESP32 directly.
- **Persistence:** memory-only for the first release. Consider local SQLite only after the team approves which progress data is useful, its retention period, and deletion controls.
- **Speech recognition:** define a Python `SpeechRecognizer` interface and start with a local implementation evaluation. Keep the recognizer replaceable. External processing requires a clear disclosure and appropriate guardian permission.
- **Progress updates:** start with bounded REST status polling. Consider Server-Sent Events only if observed delays make polling inadequate.

## 4. Phases and exit gates

**User-directed sequencing:** Complete the website and exercise its learner flows against the mock device first. Defer the assembled-board bench checks and ESP32 adapter until the website workflows are ready. During this website-first stage, hardware-specific interactions must remain clearly labeled as simulated; this sequencing does not count mock behavior as hardware validation.

### Current implementation status

| Plan area | Status | Current result |
|---|---|---|
| Phase 0: hardware validation | Deferred | Run after the website-first build, before any learner session on the physical board. |
| Phase 1: local foundation | In place | React + TypeScript, FastAPI, local health/status, mock device, and documented local setup. |
| Phase 3: letter/text practice | Mock workflow implemented | Validated A-Z input, simulated letter-by-letter progress, Braille cell preview, stop, and reset. |
| Phase 4: word session | Mock workflow implemented | In-memory session, one pattern at a time, hidden expected word, cancel, and answer outcomes. |
| Phase 5: speech recognition | Partial mock only | Typed answers exercise correct/retry/uncertain states; microphone capture and speech recognition remain outstanding. |
| Phase 6: self-guided lessons | First lesson implemented | Guided A-Z sequence, optional browser speech, session-only progress, and a bounded revisit rule. |
| Phases 7-8 | Not implemented | Optional AI decisions, accessibility evaluation, and deployment work remain. |
| Phase 2: ESP32 adapter | Deferred | The browser still talks only to the local backend; the real device client is not implemented. |

Each phase ends with a reviewable result and its exit checks. A phase that fails a hardware or privacy gate does not move into child use; development can continue against a simulator where appropriate.

### Phase 0 — Confirm scope and validate the assembled prototype

**Work**

1. Confirm the assembled unit matches the supplied pin map, servo linkage, speaker, microphone, and ESP32 board configuration.
2. Compile and flash the integrated sketch with the package’s matching audio header, ESP32 board package, ESP32Servo dependency, and partition settings.
3. Bench-check Wi-Fi, `/api/health`, `/api/status`, pin reset/neutral position, each A-Z servo pattern, letter playback, microphone WAV quality, and power stability during combined movement/audio.
4. Agree the word-quiz advance control. Recommended MVP: a large, keyboard/switch-accessible **Next letter** control operated by the teacher/adult. The current unit has one cell, no touch sensor, and a physical button assigned to recording. Independent child advancement needs a compatible firmware/hardware control.
5. Start with short curated words. The recording endpoint captures exactly three seconds; measure if that captures a whole word reliably before changing firmware.

**Deliverables**

- A recorded hardware validation checklist with firmware revision, board settings, and observed issues.
- Written decision for letter advancement and initial word length/list.
- A documented list of known limitations and any required firmware change.

**Exit gate**

The integrated sketch compiles and the assembled prototype passes the bench checks, or blockers are documented with an agreed fallback. The team accepts the single-cell, one-letter-at-a-time MVP interaction.

### Phase 1 — Create the local application foundation

**Work**

1. Add the proposed `frontend/` and `backend/` structure, dependency manifests, `.gitignore`, environment example, and local run instructions.
2. Implement the FastAPI app shell, `/api/v1/health`, Pydantic error envelope, and API version prefix.
3. Implement the React + TypeScript app shell with separate teacher setup and learner activity areas, accessible navigation, connection state, and a friendly offline state.
4. Add a `DeviceClient` interface and a deterministic mock implementation. The website must be usable for UI work without the physical ESP32.
5. Add a configuration boundary for the device URL and speech mode. Keep Wi-Fi credentials and service secrets out of source control and browser assets.
6. Establish formatting, linting, and type-check commands in project documentation. Add automated tests in the relevant later implementation work and run them when implementation verification is requested.
7. Use Three.js only for the decorative homepage Braille particle field. Keep its fallback, reduced-motion behavior, mobile pixel-ratio cap, and off-screen pause; all learning instructions and status remain accessible HTML.

**Deliverables**

- Local app starts from documented commands.
- Browser health check and backend health route work in mock mode.
- Typed API examples and error codes are recorded alongside the schema.

**Exit gate**

A developer can run the local UI and backend without hardware, see an explicit mock-device indicator, and understand how to configure a real device.

### Phase 2 — Implement and verify the ESP32 adapter

**Work**

1. Implement one backend adapter module for the existing routes: `/api/health`, `/api/status`, `/api/learn`, `/api/quiz/show`, `/api/quiz/record`, `/api/mic.wav`, `/api/quiz/feedback`, and `/api/pins/reset`.
2. Match the actual firmware request fields and response bodies; do not infer that proposed website routes exist on the ESP32.
3. Serialize all hardware actions. Treat `202` as queued, `409` as busy/retryable, and timeouts/offline/malformed responses as recoverable errors.
4. Use bounded timeouts and status polling because the firmware web server is single-threaded and hardware operations may delay requests.
5. Add a teacher-only device panel for status, connection diagnostics, safe test tone, and reset. Avoid exposing low-level controls in the learner flow.

**Deliverables**

- Working real and mock `DeviceClient` implementations with the same interface.
- Device status and action state translated into stable website states.
- A bench procedure for connection loss, busy responses, delayed requests, and reset.

**Exit gate**

With the real unit on trusted Wi-Fi, a teacher can check status, send one letter, observe the expected dot pattern and audio, and recover from a busy or disconnected device. No direct public exposure of the ESP32 is required.

### Phase 3 — Ship letter and text practice

**Work**

1. Build input, review, start, progress, stop/cancel where supported, replay, and reset flows.
2. Accept only A-Z and spaces; normalize case consistently; reject empty input and over-limit text before a device call. Respect the firmware’s 40-character maximum.
3. Explain that the cell shows one character at a time. Do not present a whole word as if it appears simultaneously.
4. Present queued/running/completed/busy/offline/error state through both screen-reader announcements and visible text/audio cues.
5. Keep submit controls disabled while a conflicting hardware action is active. Provide a teacher recovery action.

**Deliverables**

- Accessible practice screen connected to the device adapter.
- Documented input rules and user-facing recovery messages.
- Verified practice flow in mock mode and on the assembled board.

**Exit gate**

A teacher can enter supported practice text, start it, follow progress, and recover from device errors. Keyboard-only operation and a screen-reader pass cover the main path.

### Phase 4 — Add the private word-quiz session controller

**Work**

1. Create an in-memory session with an opaque ID, mode, current letter index, state, and server-only expected word.
2. Validate words against A-Z and the agreed MVP length/list. Keep the expected answer out of learner responses, browser state, URLs, logs, and error messages.
3. Present one character at a time through `/api/quiz/show`; provide the approved advance control, replay-current-letter, cancel, and teacher reset paths.
4. Implement the state transitions for ready, presenting, waiting for answer, recording, processing, feedback, completed, cancelled, and recoverable failures.
5. Use the existing recording control strategy agreed in Phase 0. If the website starts recording, clearly announce when capture begins and ends.

**Deliverables**

- Session API and state machine matching the application flow.
- Learner screen that never reveals the target word before an explicit teacher reveal.
- Reproducible mock quiz covering each state and recovery path.

**Exit gate**

A short target can be presented letter by letter on the one-cell board, advanced using the agreed control, and cancelled/reset without leaking the target to learner-facing responses.

### Phase 5 — Add speech recognition, scoring, and feedback

**Work**

1. Implement the `SpeechRecognizer` interface with result text, confidence when available, and a clear recognizer failure result.
2. Request recording from the device, confirm it finished, retrieve the 16 kHz mono PCM16 WAV, and pass it to the recognizer.
3. Keep WAV data in memory or a temporary file and delete it in a `finally` cleanup path after evaluation. Never persist it by default.
4. Normalize transcript case and punctuation for comparison. Use confidence thresholds and outcomes `correct`, `retry`, or `uncertain`; recognition failure or low confidence must not be treated as a wrong answer.
5. Return only learner-appropriate feedback. Use computer/browser speech for full prompts and sentences; firmware assets currently provide letter clips and tones only.
6. Evaluate accuracy and capture duration on representative, consented recordings. If three seconds is too short, change firmware to a bounded start/stop or configurable recording protocol before relying on word scoring.

**Deliverables**

- Pluggable recognizer adapter and mock recognizer.
- End-to-end word quiz with supportive retry and “not sure” paths.
- Privacy and accuracy evaluation notes, including false acceptance/rejection observations.

**Exit gate**

The entire flow works on the assembled unit for an agreed set of short words, audio cleanup is verified, low-confidence answers are not marked incorrect, and the team has accepted the limits of its speech accuracy.

### Phase 6 — Add self-guided lessons and lightweight adaptation

**Work**

1. Author a small, educator-reviewed sequence: letter recognition, tactile practice, simple contrasts, then short words.
2. Implement explainable selection rules such as revisiting missed items and spacing items the learner answers confidently.
3. Start with session-only progress in memory. If persistence is approved, add local SQLite with pseudonymous IDs, minimal aggregate outcomes, teacher-controlled deletion, and a defined retention period.
4. Keep teacher-selected/manual practice available. Avoid diagnostic claims or ranking children.

**Deliverables**

- Bounded self-guided lesson flow and teacher overview.
- Written data dictionary and retention/deletion policy before enabling persistence.

**Exit gate**

A learner can continue a short, approved lesson with accessible prompts and adult recovery. Any saved data has an approved purpose, consent path, and deletion behavior.

### Phase 7 — Evaluate optional AI features

**Work**

1. Evaluate recognizer performance across intended words, voices, background noise, and microphone conditions. Report uncertainty rather than hiding it.
2. Prefer local inference where practical. Any external speech service must be explicitly configured, disclosed to guardians/educators, and disabled by default until its permission and retention policy is approved.
3. Add adaptive practice based on deterministic rules before considering generative help.
4. If teacher-reviewed AI lesson suggestions or hints are later added, restrict them to approved literacy content, provide a deterministic fallback, log only minimal operational data, and give teachers an off switch.

**Deliverables**

- Accuracy, latency, privacy, and fallback evaluation.
- A separate feature decision for each AI capability; AI does not enter the MVP by default.

**Exit gate**

Each enabled AI feature has a measured benefit, a safe fallback, explicit adult controls, and an approved data-processing policy.

### Phase 8 — Prepare supervised classroom deployment

**Work**

1. Run accessibility reviews with blind/low-vision learners and educators, including screen readers, keyboard, audio prompts, and nonvisual error recovery.
2. Review moving parts, servo limits, power, enclosure, cleaning, and supervised-use procedure with the hardware team.
3. Define local install/update, network setup, device pairing, backup, and troubleshooting instructions.
4. Add local access controls before multi-classroom use. Add an authenticated secure gateway before any remote control; never port-forward the current unauthenticated ESP32 API.

**Deliverables**

- Classroom setup and operation guide, accessibility findings, and hardware safety checklist.
- Deployment decision with supported network model and update procedure.

**Exit gate**

Educators can install, connect, run, stop, and recover the supervised prototype using documented steps. Any deployment beyond a trusted local network has a separately reviewed secure gateway.

## 5. Proposed source layout

```text
frontend/
  src/
    app/                 # routing and application shell
    components/          # reusable accessible controls
    features/            # practice, quiz, teacher device panel
    api/                 # typed browser-to-backend client
    styles/              # CSS and design tokens
backend/
  app/
    api/                 # versioned FastAPI routes
    schemas/             # Pydantic request/response types
    device/              # DeviceClient interface and ESP32 implementation
    lessons/             # session state and lesson logic
    speech/              # SpeechRecognizer interface and implementations
    storage/             # memory first; SQLite only in a later approved phase
docs/
  ...                    # product and implementation references
```

Keep hardware endpoint details in `backend/app/device/`; keep answer keys and scoring in backend lesson services; keep browser components unaware of ESP32 paths. The mock device and mock recognizer should implement the same interfaces as their real counterparts.

## 6. Cross-phase engineering and release rules

- Validate user input on both frontend and backend. Limit MVP text to supported A-Z and spaces.
- Expose consistent API error codes, including `DEVICE_OFFLINE`, `DEVICE_BUSY`, `UNSUPPORTED_INPUT`, `RECORDING_FAILED`, `TRANSCRIPTION_UNCERTAIN`, and `SESSION_NOT_FOUND`.
- Never send the expected answer to the learner UI before teacher reveal. Do not put answers or raw audio in ordinary logs.
- Show an accessible state for every waiting or error condition. Do not use color, animation, or visual-only progress as the sole signal.
- Keep the backend bound to local access by default and the ESP32 on a trusted Wi-Fi network. The backend is the only component that calls the device.
- Serialize device operations and use bounded retry/timeouts. Do not retry a movement/record command automatically when its completion is ambiguous; check status first to avoid duplicate actions.
- Every learner-facing release remains supervised until accessibility, device safety, speech accuracy, and recovery checks pass.

## 7. First implementation milestone

Start with **Phase 1** and implement the learner workflows in mock mode first. Complete letter practice, the word-session interface, speech/answer checking boundaries, and self-guided lessons against simulated device and recognition adapters. Clearly label every simulated behavior. After the website flows are reviewable, proceed to **Phase 0** hardware validation, then implement **Phase 2** and replace the mock device adapter with the ESP32 client. Revisit microphone capture and recording duration against the assembled board before learner trials.

The key product decision to record before Phase 4 is the MVP advance control. The recommendation is teacher-controlled **Next letter** for the first supervised release. Independent learner progression would require a button/control mapped in firmware or a touch sensor; the current optional GPIO4 button is used to start recording.

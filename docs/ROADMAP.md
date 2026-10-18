# DotSync website and learning roadmap

## Recommendation

Build DotSync first as a local web application running on a laptop or classroom computer on the same Wi-Fi network as the ESP32. Keep the ESP32 responsible for the tactile cell, speaker, and microphone. Put lesson flow, speech recognition, answer checking, and feedback in the computer-side backend.

Start with English Grade 1 A-Z, short words, and a teacher-controlled lesson. Make each step usable without sight: spoken prompts, keyboard and switch-friendly controls, and clear audio feedback. Add adaptive practice after the basic word-reading loop is reliable.

## What the supplied project already provides

- A unified ESP32 sketch with one HTTP server, six servo outputs, MAX98357A speaker playback, and INMP441 microphone capture.
- A-Z Braille Grade 1 patterns and recorded letter audio at 16 kHz. Learn mode accepts up to 40 characters and displays one letter at a time.
- Quiz endpoints to raise one letter without saying it, capture a three-second microphone recording, retrieve a PCM16 WAV, and play a correct or incorrect tone.
- A status endpoint and a busy response for coordinating actions.

The ZIP describes the integrated sketch as statically reviewed, with compilation and physical validation still outstanding. That does not dispute that the hardware has been built; it means the combined firmware and website interface still need to be exercised on the assembled unit. The package also limits the current cell to one letter at a time. It has no touch sensor, word-level speech output, speech recognition, scoring, student profiles, or learner-facing accessible website. Its letter input silently replaces unsupported characters with spaces, so the website should validate input and explain the A-Z limit instead.

## Recommended architecture

```text
Learner / teacher browser
          | same-origin HTTPS or local HTTP
          v
Computer-side web app and backend
  - lesson/session state
  - device API adapter
  - WAV retrieval and speech recognition
  - answer comparison and feedback
          | HTTP over the classroom Wi-Fi
          v
ESP32 firmware -> six-dot cell, speaker, microphone
```

For a first build, a React + TypeScript interface and a small Python FastAPI backend are a practical option. The backend serves or proxies the website and is the only software that talks directly to the ESP32. It can poll device status, coordinate the long-running hardware actions, download the WAV, and call a local speech-recognition service. The browser talks only to the backend, avoiding direct-browser CORS problems and keeping any service credentials out of the page.

Keep the prototype on a trusted local network. The ESP32 API currently has no authentication or TLS, so do not expose its port to the public internet. A remotely hosted website would need a secure local gateway and device authentication before it could control the hardware.

## Learner flows

### 1. Guided letter or text practice

1. Teacher or learner enters a letter, short word, or string.
2. The website accepts A-Z and spaces, explains unsupported characters, and offers a clear start, pause/stop, replay, and reset action.
3. The backend sends supported text to the existing `/api/learn` endpoint.
4. The cell displays each letter in sequence while the ESP32 plays its letter recording. The computer page announces progress and offers help if the device is busy or unreachable.

This flow can use the existing firmware route. The cell is one character wide: it cannot show a full word all at once. The supplied audio assets are letter names, not complete words or spoken instructions.

### 2. Word-reading quiz

1. Teacher selects a short target word and starts a quiz. The backend keeps the expected word private from the learner page.
2. The backend presents its letters one at a time on the single Braille cell. The learner explores each pattern and advances through the word using the agreed control method.
3. The learner says the complete word. The website requests a recording from the ESP32, retrieves `/api/mic.wav`, and sends the audio to speech recognition.
4. The backend compares the transcript with the private target. It uses confidence thresholds: a low-confidence result prompts another recording or teacher help instead of marking the child wrong.
5. The learner hears a short response from the computer, such as “That’s right” or “Let’s try again.” The ESP32 can also play its existing feedback tone.

The current `/api/quiz/show` accepts one letter only, and `/api/quiz/record` captures exactly three seconds. The backend can initially step through letters by calling the existing endpoint, but the interaction needs a dependable advance control. Word-length recordings may require a configurable duration or start/stop recording controls after testing.

## Roadmap

### Phase 0 — Validate the assembled device and freeze the first scope

- Compile and upload the supplied sketch with its matching `alphabet_audio.h`, ESP32 board package, ESP32Servo library, and partition settings from the package.
- On the actual board, verify Wi-Fi, health/status routes, speaker output, servo directions and neutral position, learn-mode timing, and a microphone WAV that sounds clear.
- Check the documented pin map and power behavior under combined movement. Keep the linkages guarded and have an adult review the mechanism before learner handling.
- Decide how a learner advances between letters and whether the product needs touch detection or multiple Braille cells. Record the answer before designing the word lesson.

**Exit condition:** the current hardware actions work on the assembled unit, and the one-cell word interaction is agreed.

### Phase 1 — Local connected website MVP

- Build an accessible home page with two modes: “Practice” and “Read a word.” Add a teacher setup area and a simple learner area.
- Add device connection/status display, pairing by local IP or a small device-discovery step, busy/progress handling, timeouts, and recovery instructions.
- Implement text practice using `/api/learn`, plus test controls for one letter, speaker tone, gain, and pin reset in the teacher area only.
- Enforce A-Z and spaces in the site and show an understandable message for unsupported input.
- Do not require accounts or save voice recordings in this phase.

**Exit condition:** a teacher can type text in the website and reliably operate the assembled board from the same Wi-Fi network.

### Phase 2 — Guided word quiz and speech checking

- Add a backend lesson/session controller that stores the target word, current letter, recording state, and result. Never return the target to the learner page before the answer.
- Step through target letters using the single cell. Add replay and reset; implement the agreed next/advance control.
- Orchestrate record, wait for completion, WAV download, transcription, confidence handling, comparison, and feedback. Handle `202` queued requests, `409` busy responses, device delays, and missing WAV files.
- Start with a small set of short words and test recording duration. Extend the firmware recording controls only if three seconds is too short.
- Provide spoken prompts/feedback from the computer in the first version. The ESP32 currently has A-Z recordings and tones, not word-level or conversational speech.

**Exit condition:** the child can read a short word through tactile letters, speak it, and receive a correct, retry, or “not sure” response without the answer leaking into the learner view.

### Phase 3 — Self-guided practice and progress

- Add a curated sequence: identify a letter, practice a familiar letter, contrast similar patterns, then read short words.
- Track only the minimum useful session data: letters/words attempted, correct/retry outcome, confidence band, and practice date. Start with anonymous local profiles and teacher controls.
- Recommend the next practice item with simple, explainable rules such as revisiting missed letters and spacing out mastered letters. Keep a manual mode so an educator can choose lessons.
- Add optional progress summaries for teachers; do not make diagnostic or clinical claims.

**Exit condition:** a learner can start and continue a safe, bounded practice session without a teacher selecting every individual prompt.

### Phase 4 — Carefully scoped AI enhancements

- Evaluate speech-recognition choices with real recordings from the intended environment and child voices, with appropriate consent. Measure confusion between letter names and words; tune “correct,” “retry,” and “uncertain” thresholds from results.
- Prefer local speech recognition where practical. If audio is sent to an external service, disclose that clearly, obtain appropriate guardian consent, minimize retention, and provide a non-AI path.
- Add adaptive review from learner performance before adding generative features.
- Later, consider teacher-reviewed lesson suggestions or bounded conversational hints. Keep responses tied to approved literacy content, include a deterministic fallback, and give teachers control over what is enabled.

**Exit condition:** each AI feature has measured accuracy, a safe fallback, a clear privacy choice, and a way for a teacher to review or disable it.

### Phase 5 — Classroom-ready deployment

- Add local user/session access controls, retention settings, device recovery and update procedures, and deployment documentation.
- Review accessibility with blind/low-vision users and educators; review the physical enclosure, moving parts, and operating procedures before supervised learner trials.
- If use beyond the local network is needed, add a secure authenticated gateway rather than exposing the current ESP32 HTTP server.

## Key implementation details

- Keep the current ESP32 endpoints as the initial device adapter: `/api/health`, `/api/status`, `/api/learn`, `/api/quiz/show`, `/api/quiz/record`, `/api/mic.wav`, `/api/quiz/feedback`, and `/api/pins/reset`.
- The backend should own lesson state and expected answers. The ESP32 should receive only the current letter pattern and device actions.
- Make hardware commands serial. The firmware is single-threaded and can delay HTTP handling while it moves servos, plays audio, or records. Show progress, prevent duplicate submissions, and allow safe recovery.
- Treat speech recognition as uncertain. Normalize case and punctuation for comparison, but retain a low-confidence retry path; similar letter names can be hard to distinguish.
- Keep voice clips transient by default and delete them after evaluation. Do not upload children's recordings to an external service without clear disclosure and permission.
- Add screen-reader labels, large controls, keyboard support, high contrast, and audio prompts. Never rely on color or visual-only progress to tell a learner what to do.

## Decisions to confirm before implementation

The current hardware has one Braille cell and no touch sensor. For a word, it can present one letter at a time; it cannot display or sense the whole word simultaneously. Should the first version cycle through the word on this cell with a button or teacher-controlled advance, or is touch-triggered advancement / simultaneous multi-cell display a requirement? The latter changes the hardware and firmware scope.

## Package references reviewed

`DotSync_Integration_Package.zip`: `README.md`, `docs/AI_WEBSITE_HANDOFF.md`, `docs/WEB_API_CONTRACT.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/CONNECTIONS.md`, `docs/VALIDATION_STATUS.md`, and `docs/TEST_AND_CALIBRATION.md`; plus `DotSync_Integrated_Prototype.ino`.

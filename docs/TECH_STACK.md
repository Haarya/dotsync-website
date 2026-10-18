# DotSync Website Technology Stack

**Status:** Proposed MVP stack

## 1. Runtime architecture

- **Browser UI:** responsive web app for teacher and learner modes.
- **Local backend:** runs on the classroom laptop/computer and serves the UI/API. It owns lessons, device orchestration, transcription, scoring, and feedback.
- **ESP32:** remains the real-time hardware controller for the one-cell Braille display, speaker, and microphone.
- **Network:** browser to backend is same-origin; backend to ESP32 is HTTP over the trusted local Wi-Fi network.

## 2. Recommended stack

| Layer | MVP choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite | Familiar component model and accessible web UI; static assets can be served by the backend. |
| Styling | Plain CSS with design tokens | Keeps the interface lightweight while supporting a high-contrast dark theme and responsive layouts. |
| Decorative 3D | Three.js for the Braille particle artwork only | Adds a responsive, low-cost dot field with a WebGL fallback; it must not carry instructions or status information. |
| Backend | Python 3 + FastAPI + Pydantic | Simple local HTTP service, typed request/response validation, and easy integration with Python speech tools. |
| Persistence | None for MVP; SQLite in later progress phase | Avoid retaining learner information before a real need and consent policy exist. |
| Device integration | Python HTTP client behind a `DeviceClient` adapter | Contains ESP32-specific paths, timeouts, and error handling in one module. |
| Progress updates | REST polling initially; Server-Sent Events if measured latency warrants it | Simpler to ship while the ESP32 uses a blocking single-threaded web server. |
| Speech recognition | Pluggable `SpeechRecognizer` interface; evaluate a local model first | Keeps model choice replaceable and limits voice exposure. Use a remote service only with disclosure and permission. |
| Packaging | Local run script first; package as a desktop/local service after MVP | Makes same-network setup testable before installer work. |

## 3. Project structure proposal

```text
frontend/
  src/                 # React pages, components, state, accessibility helpers
backend/
  app/                 # FastAPI routes, schemas, services
    device/            # ESP32 client adapter
    lessons/           # lesson/session logic
    speech/            # transcription interface and implementations
    storage/           # later SQLite repository
docs/                  # product, flow, stack, and implementation guides
```

## 4. Environment configuration

- `DOTSYNC_DEVICE_URL`: local ESP32 base URL, such as `http://192.168.1.50`.
- `DOTSYNC_SPEECH_MODE`: `local` by default; any external mode must be explicitly configured.
- Keep secrets and Wi-Fi credentials out of source control and browser bundles. Use local environment files excluded by `.gitignore` if credentials are ever needed.
- Do not port-forward the ESP32 or bind the local backend to public interfaces by default.

## 5. Important integration constraints

- Existing firmware endpoints are form-encoded and return queued responses for many actions. Device actions are serialized and long operations can block the web server.
- `/api/quiz/record` captures exactly three seconds and `/api/mic.wav` serves the latest 16 kHz mono PCM16 WAV. Confirm whether this length suits whole-word answers.
- Firmware has no TLS/authentication/CORS configuration. The backend should proxy device calls and stay on a trusted LAN.
- The site must not assume simultaneous full-word Braille display, touch sensing, or spoken word-level output from the ESP32.

## 6. Visual and motion constraints

- Use the selected sunset accents (`#EA6113`, `#F88F22`, `#FBB931`, `#FFE3B3`) against a dark brown-black base.
- Keep Three.js decorative and limited to the homepage particle/Braille artwork. The text, navigation, lessons, and device state remain ordinary semantic HTML.
- Provide a non-WebGL fallback, cap device pixel ratio on mobile, stop rendering off-screen, and respect `prefers-reduced-motion`.
- Do not use motion to convey a learning instruction or device state. Keep pointer response subtle and avoid continuous movement when reduced motion is requested.

## 7. Upgrade path

Add SQLite only when progress persistence is approved. Add authenticated local users/device pairing before multiple classrooms. Add a secure gateway and device credentials before remote access. Keep all speech recognition implementations behind the same interface so accuracy, latency, and privacy can be compared without changing lesson logic.

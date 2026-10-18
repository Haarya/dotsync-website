# DotSync Project Guidelines

These guidelines apply to the website, backend, and future firmware integration work.

## Product and scope

- Treat the first release as a supervised English Grade 1 A-Z prototype.
- Distinguish implemented firmware behavior from planned website/backend behavior in documentation and UI copy.
- A single six-dot cell presents one letter at a time. Do not describe it as displaying a whole word or sensing a learner's touch.
- Keep AI off the ESP32. Use a replaceable computer-side speech-recognition adapter.

## Device and API integration

- Keep ESP32-specific paths and form encoding inside one `DeviceClient` module.
- Serialize hardware commands and handle queued, busy, delayed, and failed responses.
- Never show the expected quiz answer in learner-facing data before the activity's reveal point.
- Validate user input on the backend even when the frontend already validates it.
- Avoid logging raw audio, transcripts, Wi-Fi credentials, or service keys.

## Accessibility and child-centered behavior

- Make primary flows usable by keyboard and screen reader. Provide spoken prompts and outcomes.
- Use supportive, neutral retry language. Do not shame, rank, or penalize a child for a low-confidence transcription.
- Keep teacher controls distinct from learner controls and offer an adult reset/exit action.
- Do not use color, animation, or visual-only state as the only way to communicate status.

## Privacy and security

- Default to local processing and ephemeral audio. Delete audio after evaluation unless an approved policy explicitly requires retention.
- Collect the minimum progress data needed. Use pseudonymous local profiles if persistence is added.
- Obtain appropriate permission and clearly disclose any external processing of children's voice recordings.
- Keep the prototype on a trusted local network. Never expose the current unauthenticated ESP32 API to the public internet.
- Store configuration secrets outside source control and do not include them in logs or screenshots.

## Maintainability

- Keep lesson logic, device control, speech recognition, storage, and UI state in separate modules.
- Use typed request/response models and consistent error codes/messages.
- Document API changes in `BACKEND_SCHEMA.md` and firmware changes in the hardware integration notes.
- Prefer small changes tied to one user flow; preserve a manual fallback when speech recognition is unavailable.
- Before learner trials, complete hardware calibration, linkage guarding, accessibility review, and supervised evaluation.

# DotSync Frontend Guidelines

## 1. Audience and modes

The interface has two clear contexts:

- **Teacher mode:** chooses content, starts activities, sees device diagnostics, and can reveal answers or reset the board.
- **Learner mode:** gives one instruction at a time, supports tactile exploration, records a spoken answer, and gives supportive feedback without exposing the expected answer.

Keep the learner flow uncluttered. Technical device details belong in teacher mode.

## 2. Accessibility requirements

- Use semantic headings, buttons, form labels, landmarks, and status messages.
- Ensure every action works with keyboard alone; show visible focus and do not trap focus.
- Announce progress and errors using an appropriate live region, without repeatedly interrupting speech output.
- Provide readable text, high contrast, large touch targets, and scalable layouts.
- Pair visual state with concise spoken prompts and non-color cues. Never require a child to read a visual animation.
- Avoid auto-advancing tactile letters until the learner can control the pace or an adult has selected timed mode.
- Test with screen readers and blind/low-vision users before learner deployment.

## 3. Input and lesson behavior

- Accept only the supported A-Z letters and spaces in the first release. Explain unsupported numbers/punctuation instead of silently deleting them.
- Limit text length to the firmware-supported 40 characters in learn mode and use shorter limits for quiz words.
- Confirm the submitted text through accessible speech before starting; allow correction.
- In learner quiz mode, never show the target word in labels, page titles, hidden-but-readable text, browser notifications, or error messages.
- Offer replay, re-record, help, cancel, and reset controls with clear labels.

## 4. Required UI states

Design and announce: connecting, ready, action queued, device busy, presenting letter N of M, recording, processing answer, correct, retry, uncertain, device offline, recording failed, and completed.

For each failure, provide one next step. Example: “The board is taking longer than expected. Wait, or ask your teacher to reconnect it.”

## 5. Audio

- Avoid overlapping browser speech with the ESP32 speaker. Coordinate prompts and device playback through the session controller.
- Give a clear start/stop recording cue and recording state.
- Keep feedback short, kind, and age-appropriate. Provide a sound/tone plus spoken information when possible.
- The ESP32 currently plays letter clips and tones; use computer/browser speech for word-level prompts in the MVP.

## 6. Components and styling

- Build reusable components for `DeviceStatus`, `TextEntry`, `ActivityControls`, `ProgressAnnouncement`, `RecordingState`, and `FeedbackMessage`.
- Use shared spacing, typography, focus, contrast, and motion tokens. Respect reduced-motion preferences.
- Keep controls large and predictable; avoid gestures or drag-only actions.
- Do not depend on color alone for correctness, connectivity, or recording state.

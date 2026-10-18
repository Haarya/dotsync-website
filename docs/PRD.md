# DotSync Website — Product Requirements Document

**Status:** Draft for implementation planning  
**Version:** 0.1  
**Date:** 2026-10-18

## 1. Product summary

DotSync is a local web application that helps blind or low-vision children practice English Grade 1 Braille letters and short words using a six-servo tactile cell, speaker, and microphone controlled by an ESP32. A computer on the same trusted Wi-Fi network runs the website backend and coordinates the device. The backend may use speech recognition to check spoken answers.

The first release is a supervised prototype for A-Z. It is not a full Braille curriculum or a clinical/diagnostic tool.

## 2. Problem and users

Learners need a tactile way to explore Braille patterns and an accessible way to practice reading and saying letters or simple words. Teachers need to enter practice material, guide an activity, and understand whether the device and recording are working.

- **Learner:** explores tactile letters, listens to prompts, speaks an answer, and receives clear retry or success feedback.
- **Teacher/adult:** starts practice, selects a word or letter, monitors the device, and can reset or assist.
- **Developer/operator:** pairs the website with the ESP32, diagnoses connection issues, and calibrates device settings.

## 3. Goals

- Let a teacher submit A-Z text from the website and have the ESP32 display each letter and play its supplied letter audio.
- Support a guided word quiz: present a teacher-selected word as sequential tactile letters, record the learner saying the word, and return an understandable result.
- Make all learner actions usable without sight and support keyboard navigation and screen readers.
- Keep expected quiz answers out of learner-facing pages and keep voice recordings private and short-lived.
- Start on a trusted local network without accounts or cloud deployment requirements.

## 4. Non-goals for the first release

- Multi-cell display of an entire word at once, touch sensing, or automatic detection of a learner's hand.
- Numbers, punctuation, contractions, other languages, or a complete Braille curriculum.
- Child accounts, cloud voice storage, public internet device control, generative AI chat, or unsupervised deployment.
- Running speech recognition on the ESP32.

## 5. Core requirements

### Practice

- Teacher/learner can enter a single letter or short A-Z string with spaces.
- The site validates unsupported characters and explains the current A-Z restriction before sending input.
- The site can start practice, show progress, report connection/busy/error state, and request pin reset.
- ESP32 executes one hardware action at a time; the site prevents duplicate submissions while an action is active.

### Quiz

- Teacher selects a short target word. Backend stores the answer privately for the session.
- The website/device presents the word one letter at a time on the current single cell.
- Learner speaks the whole word through the ESP32 microphone; backend retrieves the WAV and asks a speech-recognition component for a transcript and confidence.
- Backend returns correct, retry, or uncertain. Low confidence offers a repeat or adult help rather than marking the learner wrong.
- Learner receives spoken feedback through the computer in the MVP; ESP32 tone feedback can be used as an additional cue.

### Accessibility and privacy

- Provide screen-reader labels, keyboard support, high contrast, large controls, and audio instructions. Do not use color or visual animation as the only feedback.
- Do not retain raw voice recordings after scoring by default. Use local speech recognition where practical; disclose and obtain appropriate permission before any external voice processing.
- Keep the unauthenticated ESP32 API on an isolated/trusted local network. Never expose it directly to the public internet.

## 6. Success criteria

- A teacher can send supported text from the website and observe the expected tactile/audio sequence on the assembled device.
- A learner can complete a short word exercise without the target leaking into the learner UI.
- Device busy, disconnect, recording failure, low-confidence transcription, retry, and reset states are understandable and recoverable.
- Voice is not stored beyond the configured short processing window unless a teacher/guardian-approved policy explicitly enables it.
- Educators and blind/low-vision users can complete the main flow with assistive technology before broader use.

## 7. Dependencies and release gates

- Compile and bench-validate the integrated firmware on the actual ESP32 and assembled hardware; the supplied package marks this validation outstanding.
- Verify the correct servo mapping, speaker playback, microphone WAV quality, Wi-Fi, and stable power under combined actions.
- Decide how to advance between letters. The current device has no touch sensor and its optional physical button starts recording.
- Measure speech-recognition performance on representative recordings with appropriate consent before relying on automated scoring.

## 8. Open decisions

- Is one-letter-at-a-time word presentation acceptable for MVP, and who/what advances to the next letter?
- Should speech processing be local-only, or may a later version use a disclosed external service with guardian consent?
- Which age range, initial word list, and classroom languages should the first lesson content target?

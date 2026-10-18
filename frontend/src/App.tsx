import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, DeviceStatus, HealthResponse, PracticeResponse } from "./api";

const MAX_TEXT_LENGTH = 40;

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("Checking the local service…");
  const [text, setText] = useState("");
  const [result, setResult] = useState<PracticeResponse | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refreshConnection = useCallback(async () => {
    try {
      const [healthResponse, deviceResponse] = await Promise.all([
        api.health(),
        api.deviceStatus(),
      ]);
      setHealth(healthResponse);
      setDevice(deviceResponse);
      setConnectionMessage("Local practice service is ready.");
    } catch {
      setHealth(null);
      setDevice(null);
      setConnectionMessage("The local practice service is unavailable. Start the backend, then retry.");
    }
  }, []);

  useEffect(() => {
    void refreshConnection();
    const timer = window.setInterval(() => void refreshConnection(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshConnection]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setResult(null);

    const normalized = text.trim().toUpperCase();
    if (!normalized) {
      setFormError("Enter at least one letter to begin.");
      return;
    }
    if (!/^[A-Z ]+$/.test(normalized)) {
      setFormError("For this first version, use English letters A–Z and spaces only.");
      return;
    }
    if (normalized.length > MAX_TEXT_LENGTH) {
      setFormError(`Keep practice text to ${MAX_TEXT_LENGTH} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      const practiceResult = await api.practice(normalized);
      setResult(practiceResult);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not start practice.");
    } finally {
      setSubmitting(false);
    }
  };

  const serviceReady = health?.ok === true;
  const deviceReady = device?.connected === true;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="DotSync home">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DotSync</span>
        </a>
        <span className="mode-badge"><span aria-hidden="true">●</span> Mock device mode</span>
      </header>

      <section className="intro" id="home" aria-labelledby="page-title">
        <p className="eyebrow">A calm place to practise</p>
        <h1 id="page-title">Braille practice, at your pace.</h1>
        <p className="intro-copy">
          Start with a letter or a short line. DotSync will send it to the practice service;
          this first build simulates the board while the device connection is being prepared.
        </p>
      </section>

      <section className="connection-card" aria-labelledby="connection-title">
        <div className="connection-icon" aria-hidden="true">{serviceReady && deviceReady ? "✓" : "…"}</div>
        <div className="connection-copy">
          <h2 id="connection-title">Practice service</h2>
          <p role="status" aria-live="polite">{connectionMessage}</p>
          <p className="device-note">
            {device?.message ?? "No ESP32 commands are sent in mock mode."}
          </p>
        </div>
        <button className="quiet-button" type="button" onClick={() => void refreshConnection()}>
          Check again
        </button>
      </section>

      <div className="workspace-grid">
        <nav className="mode-nav" aria-label="Practice modes">
          <p className="nav-label">ACTIVITY</p>
          <button className="nav-item active" type="button" aria-current="page">
            <span aria-hidden="true">Aa</span> Letter practice
          </button>
          <button className="nav-item planned" type="button" disabled>
            <span aria-hidden="true">◌</span> Word reading <small>Coming later</small>
          </button>
          <div className="nav-help">
            <p className="nav-label">FOR ADULTS</p>
            <p>Device setup and word quiz controls will be added in later phases.</p>
          </div>
        </nav>

        <section className="practice-card" aria-labelledby="practice-title">
          <div className="card-heading">
            <div>
              <p className="eyebrow">01 · LETTER PRACTICE</p>
              <h2 id="practice-title">Choose what to explore</h2>
            </div>
            <span className="limit-chip">A–Z · up to 40</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="practice-text">Letter or short text</label>
            <textarea
              id="practice-text"
              name="practiceText"
              rows={3}
              maxLength={MAX_TEXT_LENGTH}
              autoComplete="off"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setFormError("");
                setResult(null);
              }}
              placeholder="Try: CAT"
              aria-describedby="input-help input-count"
            />
            <div className="input-meta">
              <span id="input-help">Use English letters and spaces. The cell displays one letter at a time.</span>
              <span id="input-count">{text.length}/{MAX_TEXT_LENGTH}</span>
            </div>

            {formError && <p className="feedback error" role="alert">{formError}</p>}
            {result && (
              <div className="feedback success" role="status" aria-live="polite">
                <strong>Simulation complete.</strong> {result.message}
              </div>
            )}

            <button className="primary-button" type="submit" disabled={submitting || !serviceReady || !deviceReady}>
              {submitting ? "Starting…" : "Start practice"}
              <span aria-hidden="true">→</span>
            </button>
            {(!serviceReady || !deviceReady) && <p className="button-hint">The local service must be running to continue.</p>}
          </form>
        </section>
      </div>

      <footer className="page-footer">
        <span>DotSync prototype</span>
        <span>English Grade 1 Braille · A–Z</span>
      </footer>
    </main>
  );
}

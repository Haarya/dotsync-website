export type HealthResponse = {
  ok: boolean;
  service: string;
};

export type DeviceStatus = {
  mode: "mock";
  connected: boolean;
  busy: boolean;
  message: string;
};

export type PracticeResponse = {
  actionId: string;
  state: "simulated";
  characterCount: number;
  message: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; detail?: string }
      | null;
    throw new Error(payload?.message ?? payload?.detail ?? "The local service could not complete that request.");
  }

  return (await response.json()) as T;
}

export const api = {
  health: () => request<HealthResponse>("/api/v1/health"),
  deviceStatus: () => request<DeviceStatus>("/api/v1/device/status"),
  practice: (text: string) =>
    request<PracticeResponse>("/api/v1/practice", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

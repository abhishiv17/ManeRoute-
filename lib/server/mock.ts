import "server-only";

// Offline mode for UI work without spending YouCam units (YOUCAM_MOCK=1).
// Results are clearly flagged `simulated` and the UI labels them; never enable for judging.

const DELAY_MS = 2500;

export const mockTaskId = (kind: string) => `mock_${kind}_${Date.now()}`;

export function mockReady(taskId: string): boolean {
  const ts = Number(taskId.split("_").pop());
  return Date.now() - ts > DELAY_MS;
}

export const MOCK_LENGTH_TERM = process.env.YOUCAM_MOCK_TERM || "ear length";

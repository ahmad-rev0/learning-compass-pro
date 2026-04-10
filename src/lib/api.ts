/**
 * API client for the Atlas backend.
 * Uses VITE_API_URL env var, falls back to localhost for dev.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Metrics {
  error_count_last_10: number;
  avg_quiz_score_last_3: number;
  study_time_trend: number;
  current_topic: string;
  last_error: { type: string; msg: string; ts: string } | null;
  total_ticks: number;
}

export interface StateResponse {
  state: string;
  metrics: Metrics;
  simulation_running: boolean;
  student_name: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  steps: string[];
  xp_reward: number;
  resource_url: string;
  state: string;
  status: string;
  created_at: string;
  completed_at?: string;
  exa_result?: { title: string; url: string; snippet: string };
}

export interface QuestsResponse {
  active: Quest[];
  completed: Quest[];
}

export interface EventEntry {
  timestamp: string;
  tick: number;
  state: string;
  topic: string;
  error_type: string | null;
  quiz_score: number | null;
  study_minutes: number | null;
  quest_generated: string | null;
}

export interface StatsResponse {
  active_quests: number;
  completed_quests: number;
  total_xp: number;
  streak: number;
  level: number;
  motivation: string;
}

export const api = {
  getState: () => request<StateResponse>("/api/state"),
  getQuests: () => request<QuestsResponse>("/api/quests"),
  getEvents: (limit = 50) => request<{ events: EventEntry[] }>(`/api/events?limit=${limit}`),
  getStats: () => request<StatsResponse>("/api/stats"),
  startSimulation: () => request<{ status: string }>("/api/simulation/start", { method: "POST" }),
  stopSimulation: () => request<{ status: string }>("/api/simulation/stop", { method: "POST" }),
  resetSimulation: () => request<{ status: string }>("/api/simulation/reset", { method: "POST" }),
  triggerState: (state: string) => request<{ status: string }>(`/api/trigger/${state}`, { method: "POST" }),
};

import { useState, useEffect, useCallback, useRef } from "react";
import { api, StateResponse, QuestsResponse, StatsResponse, EventEntry } from "@/lib/api";

export function useSimulation() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [quests, setQuests] = useState<QuestsResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const [s, q, st, e] = await Promise.all([
        api.getState(),
        api.getQuests(),
        api.getStats(),
        api.getEvents(100),
      ]);
      setState(s);
      setQuests(q);
      setStats(st);
      setEvents(e.events);
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    poll();
    intervalRef.current = setInterval(poll, 2000);
  }, [poll]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  const start = useCallback(async () => {
    await api.startSimulation();
    poll();
  }, [poll]);

  const stop = useCallback(async () => {
    await api.stopSimulation();
    poll();
  }, [poll]);

  const reset = useCallback(async () => {
    await api.resetSimulation();
    poll();
  }, [poll]);

  const trigger = useCallback(async (s: string) => {
    await api.triggerState(s);
  }, []);

  return { state, quests, stats, events, connected, error, start, stop, reset, trigger };
}

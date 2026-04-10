import { useState, useEffect, useCallback, useRef } from "react";
import { api, StateResponse, QuestsResponse, StatsResponse, EventEntry } from "@/lib/api";
import {
  getMockState, getMockQuests, getMockStats, getMockEvents,
  getMockAgentDecisions, getMockAchievements, getMockStateHistory,
  startMockSimulation, stopMockSimulation, resetMockSimulation,
  forceMockState, getMockIsRunning,
  type AgentDecision, type Achievement,
} from "@/lib/mockData";

export function useSimulation() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [quests, setQuests] = useState<QuestsResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stateHistory, setStateHistory] = useState<{ tick: number; state: string }[]>([]);
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollMock = useCallback(() => {
    setState(getMockState());
    setQuests(getMockQuests());
    setStats(getMockStats());
    setEvents(getMockEvents());
    setAgentDecisions(getMockAgentDecisions());
    setAchievements(getMockAchievements());
    setStateHistory(getMockStateHistory());
  }, []);

  const pollApi = useCallback(async () => {
    try {
      const [s, q, st, e] = await Promise.all([
        api.getState(), api.getQuests(), api.getStats(), api.getEvents(100),
      ]);
      setState(s);
      setQuests(q);
      setStats(st);
      setEvents(e.events);
      setConnected(true);
      setError(null);
      setDemoMode(false);
    } catch {
      // Fall back to demo mode
      setConnected(false);
      setDemoMode(true);
      pollMock();
    }
  }, [pollMock]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    pollApi();
    intervalRef.current = setInterval(() => {
      if (demoMode) pollMock();
      else pollApi();
    }, 1500);
  }, [pollApi, pollMock, demoMode]);

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

  // Re-poll mock data frequently when in demo mode
  useEffect(() => {
    if (!demoMode) return;
    const id = setInterval(pollMock, 1500);
    return () => clearInterval(id);
  }, [demoMode, pollMock]);

  const start = useCallback(async () => {
    if (demoMode) { startMockSimulation(); pollMock(); return; }
    try { await api.startSimulation(); } catch { startMockSimulation(); setDemoMode(true); }
  }, [demoMode, pollMock]);

  const stop = useCallback(async () => {
    if (demoMode) { stopMockSimulation(); pollMock(); return; }
    try { await api.stopSimulation(); } catch { stopMockSimulation(); }
  }, [demoMode, pollMock]);

  const reset = useCallback(async () => {
    if (demoMode) { resetMockSimulation(); pollMock(); return; }
    try { await api.resetSimulation(); } catch { resetMockSimulation(); }
  }, [demoMode, pollMock]);

  const trigger = useCallback(async (s: string) => {
    if (demoMode) { forceMockState(s); pollMock(); return; }
    try { await api.triggerState(s); } catch { forceMockState(s); }
  }, [demoMode, pollMock]);

  return {
    state, quests, stats, events, agentDecisions, achievements, stateHistory,
    connected, demoMode, error,
    start, stop, reset, trigger,
    isRunning: demoMode ? getMockIsRunning() : (state?.simulation_running ?? false),
  };
}

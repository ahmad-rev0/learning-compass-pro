/**
 * Mock data engine that simulates the full agent loop client-side.
 * Used when backend is not connected (demo mode).
 */
import type { StateResponse, QuestsResponse, StatsResponse, EventEntry, Quest } from "@/lib/api";

const TOPICS = ["recursion", "arrays", "linked_lists", "sorting", "dynamic_programming", "graphs", "binary_trees", "hash_maps"];
const ERROR_TYPES = ["IndexError", "NameError", "TypeError", "KeyError", "RecursionError", "AttributeError"];
const STATES = ["normal", "normal", "normal", "micro_stuck", "momentum_dip", "double_trouble"] as const;

const QUEST_TEMPLATES: Record<string, { title: string; desc: string; steps: string[]; xp: number }> = {
  micro_stuck: {
    title: "Escape the {error} Labyrinth",
    desc: "You've been hitting {error} errors repeatedly. Time to break free!",
    steps: ["Read the error traceback carefully", "Check variable types and scopes", "Consult the Exa resource below", "Fix and re-run your code"],
    xp: 30,
  },
  momentum_dip: {
    title: "Rediscover {topic}",
    desc: "Your momentum on {topic} has dipped. Let's reignite your curiosity!",
    steps: ["Review {topic} fundamentals (5 min)", "Complete the mini-challenge", "Score 80%+ on the quiz"],
    xp: 50,
  },
  double_trouble: {
    title: "The Great {topic} Recovery",
    desc: "Both errors and momentum are down. Time for an epic recovery quest!",
    steps: ["Take a 2-minute break", "Review {topic} basics", "Fix the {error} bug step-by-step", "Complete the recovery challenge", "Celebrate your comeback! 🎉"],
    xp: 100,
  },
};

const EXA_RESULTS = [
  { title: "Understanding Recursion in Python - Real Python", url: "https://realpython.com/python-recursion/", snippet: "Recursion is a technique where a function calls itself. Learn base cases, recursive cases, and how to avoid infinite loops..." },
  { title: "Python IndexError: How to Fix It - Stack Overflow", url: "https://stackoverflow.com/questions/python-indexerror", snippet: "An IndexError occurs when you try to access an index that doesn't exist in a list. Common fixes include checking list length..." },
  { title: "Dynamic Programming Made Easy - GeeksforGeeks", url: "https://www.geeksforgeeks.org/dynamic-programming/", snippet: "Dynamic programming breaks complex problems into simpler subproblems. Learn memoization and tabulation techniques..." },
  { title: "Binary Tree Traversal Algorithms - Visualgo", url: "https://visualgo.net/en/bst", snippet: "Interactive visualization of binary tree operations including insertion, deletion, and traversal (inorder, preorder, postorder)..." },
  { title: "Hash Map Implementation in Python - Medium", url: "https://medium.com/python-hash-maps", snippet: "Build a hash map from scratch. Understand hash functions, collision resolution, and why dictionaries are O(1) on average..." },
];

const ACHIEVEMENTS = [
  { id: "first_quest", title: "First Steps", description: "Complete your first quest", icon: "🏆", unlocked: true, unlockedAt: "2 min ago" },
  { id: "streak_3", title: "On Fire", description: "Complete 3 quests in a row", icon: "🔥", unlocked: true, unlockedAt: "5 min ago" },
  { id: "bug_slayer", title: "Bug Slayer", description: "Fix 5 code errors", icon: "🐛", unlocked: true, unlockedAt: "8 min ago" },
  { id: "comeback_kid", title: "Comeback Kid", description: "Recover from double_trouble", icon: "💪", unlocked: false },
  { id: "streak_10", title: "Unstoppable", description: "Complete 10 quests in a row", icon: "⚡", unlocked: false },
  { id: "level_5", title: "Scholar", description: "Reach level 5", icon: "🎓", unlocked: false },
  { id: "topic_master", title: "Topic Master", description: "Complete quests across 5 topics", icon: "🧠", unlocked: false },
  { id: "speed_demon", title: "Speed Demon", description: "Complete a quest in under 30 seconds", icon: "💨", unlocked: false },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AgentDecision {
  id: string;
  timestamp: string;
  state: string;
  reasoning: string;
  action: string;
  exaQuery: string;
  confidence: number;
}

let tickCounter = 0;
let totalXP = 280;
let streak = 5;
let level = 3;
let currentTopic = "recursion";
let currentState = "normal";
let activeQuests: Quest[] = [];
let completedQuests: Quest[] = [];
let eventLog: EventEntry[] = [];
let agentDecisions: AgentDecision[] = [];
let stateHistory: { tick: number; state: string }[] = [];
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function generateQuest(state: string): Quest {
  const error = randChoice(ERROR_TYPES);
  const template = QUEST_TEMPLATES[state] || QUEST_TEMPLATES.micro_stuck;
  const exa = randChoice(EXA_RESULTS);
  return {
    id: genId(),
    title: template.title.replace("{error}", error).replace("{topic}", currentTopic),
    description: template.desc.replace("{error}", error).replace("{topic}", currentTopic),
    steps: template.steps.map(s => s.replace("{error}", error).replace("{topic}", currentTopic)),
    xp_reward: template.xp,
    resource_url: exa.url,
    state,
    status: "active",
    created_at: new Date().toISOString(),
    exa_result: exa,
  };
}

function generateAgentDecision(state: string): AgentDecision {
  const reasonings: Record<string, string> = {
    micro_stuck: `Detected ${Math.floor(Math.random() * 3) + 3} errors in last 10 ticks. Error pattern: repeated ${randChoice(ERROR_TYPES)}. Student appears stuck on ${currentTopic}.`,
    momentum_dip: `Quiz average dropped to ${(Math.random() * 20 + 45).toFixed(1)}%. Study time trending down by ${Math.floor(Math.random() * 20 + 15)} minutes. Engagement declining on ${currentTopic}.`,
    double_trouble: `CRITICAL: Both error rate (${Math.floor(Math.random() * 3) + 4} errors) AND momentum indicators are triggered. Student needs immediate intervention on ${currentTopic}.`,
  };
  const actions: Record<string, string> = {
    micro_stuck: `Querying Exa for code fix resources → Generating "Escape the Labyrinth" quest (30 XP)`,
    momentum_dip: `Querying Exa for ${currentTopic} tutorials → Generating "Rediscover" quest (50 XP)`,
    double_trouble: `Deep Exa search + crawl → Generating "Great Recovery" quest (100 XP) with 5-step plan`,
  };
  return {
    id: genId(),
    timestamp: new Date().toISOString(),
    state,
    reasoning: reasonings[state] || "Monitoring...",
    action: actions[state] || "No action needed",
    exaQuery: state === "micro_stuck" ? `fix ${randChoice(ERROR_TYPES)} python ${currentTopic}` :
              state === "momentum_dip" ? `${currentTopic} tutorial beginner python` :
              `${randChoice(ERROR_TYPES)} ${currentTopic} recover learning python`,
    confidence: Math.random() * 0.3 + 0.7,
  };
}

function tick() {
  tickCounter++;
  const errorType = Math.random() < 0.35 ? randChoice(ERROR_TYPES) : null;
  const quizScore = Math.random() < 0.2 ? Math.random() * 60 + 40 : null;
  const studyMinutes = Math.floor(Math.random() * 50 + 10);

  if (Math.random() < 0.08) currentTopic = randChoice(TOPICS);

  // Evaluate state every 5 ticks
  if (tickCounter % 5 === 0) {
    const r = Math.random();
    if (r < 0.15) currentState = "double_trouble";
    else if (r < 0.35) currentState = "micro_stuck";
    else if (r < 0.55) currentState = "momentum_dip";
    else currentState = "normal";

    stateHistory.push({ tick: tickCounter, state: currentState });

    if (currentState !== "normal") {
      const decision = generateAgentDecision(currentState);
      agentDecisions.unshift(decision);
      if (agentDecisions.length > 50) agentDecisions.pop();

      const quest = generateQuest(currentState);
      activeQuests.unshift(quest);

      // Auto-complete older quests
      if (activeQuests.length > 3 && Math.random() < 0.7) {
        const completed = activeQuests.pop()!;
        completed.status = "completed";
        completed.completed_at = new Date().toISOString();
        completedQuests.unshift(completed);
        totalXP += completed.xp_reward;
        streak++;
        level = 1 + Math.floor(totalXP / 100);
      }
    }
  }

  const event: EventEntry = {
    timestamp: new Date().toISOString(),
    tick: tickCounter,
    state: currentState,
    topic: currentTopic,
    error_type: errorType,
    quiz_score: quizScore,
    study_minutes: studyMinutes,
    quest_generated: activeQuests.length > 0 && tickCounter % 5 === 0 && currentState !== "normal" ? activeQuests[0].title : null,
  };
  eventLog.push(event);
  if (eventLog.length > 200) eventLog.shift();
}

// Pre-populate with some history
function initMockData() {
  for (let i = 0; i < 25; i++) tick();
}
initMockData();

export function startMockSimulation() {
  if (isRunning) return;
  isRunning = true;
  intervalId = setInterval(tick, 1500);
}

export function stopMockSimulation() {
  isRunning = false;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

export function resetMockSimulation() {
  stopMockSimulation();
  tickCounter = 0;
  totalXP = 0;
  streak = 0;
  level = 1;
  currentState = "normal";
  activeQuests = [];
  completedQuests = [];
  eventLog = [];
  agentDecisions = [];
  stateHistory = [];
  initMockData();
}

export function forceMockState(state: string) {
  currentState = state;
  if (state !== "normal") {
    const decision = generateAgentDecision(state);
    agentDecisions.unshift(decision);
    const quest = generateQuest(state);
    activeQuests.unshift(quest);
    stateHistory.push({ tick: tickCounter, state });
  }
}

export function getMockState(): StateResponse {
  return {
    state: currentState,
    metrics: {
      error_count_last_10: currentState === "micro_stuck" || currentState === "double_trouble" ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2),
      avg_quiz_score_last_3: currentState === "momentum_dip" || currentState === "double_trouble" ? Math.random() * 25 + 40 : Math.random() * 20 + 75,
      study_time_trend: currentState === "momentum_dip" || currentState === "double_trouble" ? -(Math.floor(Math.random() * 15) + 15) : Math.floor(Math.random() * 20) - 5,
      current_topic: currentTopic,
      last_error: eventLog.filter(e => e.error_type).slice(-1)[0] ? { type: eventLog.filter(e => e.error_type).slice(-1)[0].error_type!, msg: `${eventLog.filter(e => e.error_type).slice(-1)[0].error_type}: something went wrong in ${currentTopic}`, ts: new Date().toISOString() } : null,
      total_ticks: tickCounter,
    },
    simulation_running: isRunning,
    student_name: "Alex Chen",
  };
}

export function getMockQuests(): QuestsResponse {
  return { active: [...activeQuests], completed: [...completedQuests].slice(0, 20) };
}

export function getMockStats(): StatsResponse {
  const motivations = [
    "You're on fire! Keep the momentum going! 🔥",
    "Every bug squashed makes you stronger! 💪",
    "Consistency beats intensity. Nice streak! ⚡",
    "The best programmers debug the most. Keep going! 🧠",
  ];
  return {
    active_quests: activeQuests.length,
    completed_quests: completedQuests.length,
    total_xp: totalXP,
    streak,
    level,
    motivation: randChoice(motivations) + (streak >= 5 ? ` 🔥 ${streak}-quest streak!` : "") + (level > 1 ? ` Level ${level} achieved!` : ""),
  };
}

export function getMockEvents(): EventEntry[] {
  return [...eventLog];
}

export function getMockAgentDecisions(): AgentDecision[] {
  return [...agentDecisions];
}

export function getMockAchievements(): Achievement[] {
  const unlockThresholds: Record<string, boolean> = {
    first_quest: completedQuests.length >= 1,
    streak_3: streak >= 3,
    bug_slayer: completedQuests.filter(q => q.state === "micro_stuck").length >= 2,
    comeback_kid: completedQuests.some(q => q.state === "double_trouble"),
    streak_10: streak >= 10,
    level_5: level >= 5,
    topic_master: new Set(completedQuests.map(q => q.title)).size >= 5,
    speed_demon: completedQuests.length >= 8,
  };
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockThresholds[a.id] ?? a.unlocked }));
}

export function getMockStateHistory(): { tick: number; state: string }[] {
  return [...stateHistory];
}

export function getMockIsRunning(): boolean {
  return isRunning;
}

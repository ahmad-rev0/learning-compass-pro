import { useMemo } from "react";
import { useDemo } from "@/contexts/DemoContext";
import {
  demoAssignments,
  demoSubmissions,
  demoQuests,
  demoProgress,
  demoAgentLogs,
} from "@/lib/demoData";
import type { WizardMood } from "@/components/WizardAvatar3D";

export interface GuidanceStep {
  id: string;
  message: string;
  action: string;
  route: string;
  priority: number; // lower = more urgent
  mood: WizardMood;
  category: "quest" | "assignment" | "progress" | "achievement" | "momentum";
}

/**
 * Determines the next best action for the student based on agent state,
 * quest status, assignment deadlines, and momentum data.
 * In demo mode, uses mock data. In production, pass live data.
 */
export function useWizardGuidance(overrideData?: {
  quests?: any[];
  assignments?: any[];
  submissions?: any[];
  progress?: any;
  agentLogs?: any[];
}): { steps: GuidanceStep[]; currentStep: GuidanceStep | null; mood: WizardMood } {
  const { isDemoMode } = useDemo();

  const steps = useMemo(() => {
    const quests = overrideData?.quests ?? (isDemoMode ? demoQuests : []);
    const assignments = overrideData?.assignments ?? (isDemoMode ? demoAssignments : []);
    const submissions = overrideData?.submissions ?? (isDemoMode ? demoSubmissions : []);
    const progress = overrideData?.progress ?? (isDemoMode ? demoProgress : null);
    const agentLogs = overrideData?.agentLogs ?? (isDemoMode ? demoAgentLogs : []);

    const guidance: GuidanceStep[] = [];

    // 1. Check for active recovery quests (highest priority — agent detected problems)
    const recoveryQuests = quests.filter(
      (q: any) => q.type === "recovery" && q.status === "active"
    );
    for (const q of recoveryQuests) {
      guidance.push({
        id: `recovery-${q.id}`,
        message: `I've found a knowledge gap! Complete "${q.title}" to strengthen your fundamentals.`,
        action: "Go to Quests",
        route: "/student/quests",
        priority: 1,
        mood: "concerned",
        category: "quest",
      });
    }

    // 2. Check for overdue assignments
    const now = Date.now();
    const overdueAssignments = assignments.filter((a: any) => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date).getTime();
      const submitted = submissions.some(
        (s: any) => s.assignment_id === a.id
      );
      return due < now && !submitted;
    });
    for (const a of overdueAssignments) {
      guidance.push({
        id: `overdue-${a.id}`,
        message: `"${a.title}" is overdue! Submit it now to stay on track.`,
        action: "Go to Assignments",
        route: "/student/assignments",
        priority: 2,
        mood: "pointing",
        category: "assignment",
      });
    }

    // 3. Momentum dip detected by agent
    const latestLog = agentLogs[0];
    if (
      latestLog &&
      (latestLog.detected_state === "momentum_dip" ||
        latestLog.detected_state === "double_trouble")
    ) {
      guidance.push({
        id: "momentum-alert",
        message:
          latestLog.detected_state === "double_trouble"
            ? "Your momentum and accuracy are both down. Let's recover together — I have a plan!"
            : "Your momentum has dipped. Let's review some fundamentals to get back on track!",
        action: "View Study Plan",
        route: "/student/study-plan",
        priority: 3,
        mood: "concerned",
        category: "momentum",
      });
    }

    // 4. Active growth quests
    const growthQuests = quests.filter(
      (q: any) => q.type === "growth" && q.status === "active"
    );
    for (const q of growthQuests) {
      guidance.push({
        id: `growth-${q.id}`,
        message: `Ready to level up? Complete "${q.title}" for +${q.xp_reward} XP!`,
        action: "Go to Quests",
        route: "/student/quests",
        priority: 5,
        mood: "pointing",
        category: "quest",
      });
    }

    // 5. Unsubmitted assignments approaching deadline
    const upcomingAssignments = assignments.filter((a: any) => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date).getTime();
      const submitted = submissions.some((s: any) => s.assignment_id === a.id);
      return !submitted && due > now && due - now < 3 * 86400000; // within 3 days
    });
    for (const a of upcomingAssignments) {
      guidance.push({
        id: `upcoming-${a.id}`,
        message: `"${a.title}" is due soon. Upload your work before the deadline!`,
        action: "Upload Work",
        route: "/student/upload",
        priority: 6,
        mood: "pointing",
        category: "assignment",
      });
    }

    // 6. Side quests available
    const sideQuests = quests.filter(
      (q: any) => q.type === "sidequest" && q.status === "active"
    );
    if (sideQuests.length > 0) {
      guidance.push({
        id: "sidequests",
        message: `You have ${sideQuests.length} side quest${sideQuests.length > 1 ? "s" : ""} to explore! Bonus knowledge awaits.`,
        action: "Explore Quests",
        route: "/student/quests",
        priority: 8,
        mood: "idle",
        category: "quest",
      });
    }

    // 7. Momentum is great — celebrate!
    if (progress && progress.momentum_score > 75 && guidance.length === 0) {
      guidance.push({
        id: "great-momentum",
        message: `Incredible momentum! You're on a ${progress.streak_days}-day streak. Keep exploring!`,
        action: "View Progress",
        route: "/student/progress",
        priority: 10,
        mood: "celebrating",
        category: "progress",
      });
    }

    // 8. Fallback — always have something to say
    if (guidance.length === 0) {
      guidance.push({
        id: "default",
        message: "Looking good, explorer! Check your quests for new adventures.",
        action: "View Quests",
        route: "/student/quests",
        priority: 99,
        mood: "idle",
        category: "quest",
      });
    }

    return guidance.sort((a, b) => a.priority - b.priority);
  }, [isDemoMode, overrideData]);

  const currentStep = steps[0] ?? null;
  const mood = currentStep?.mood ?? "idle";

  return { steps, currentStep, mood };
}

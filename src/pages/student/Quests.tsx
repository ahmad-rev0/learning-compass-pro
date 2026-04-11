import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { demoQuests } from "@/lib/demoData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, CheckCircle, Sparkles, Settings2, ExternalLink, AlertTriangle, Play, Loader2 } from "lucide-react";
import { QuestPath3D } from "@/components/QuestPath3D";
import { toast } from "sonner";
import { sfx } from "@/lib/retroSfx";

const TYPE_STYLES: Record<string, string> = {
  recovery: "bg-destructive/10 text-destructive border-destructive/30",
  growth: "bg-primary/10 text-primary border-primary/30",
  sidequest: "bg-warning/10 text-warning border-warning/30",
};

interface QuestStep {
  text: string;
  resource_url?: string | null;
  resource_title?: string | null;
}

function parseSteps(raw: unknown): QuestStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    if (typeof s === "string") return { text: s, resource_url: null, resource_title: null };
    return {
      text: s?.text || String(s),
      resource_url: s?.resource_url || null,
      resource_title: s?.resource_title || null,
    };
  });
}

export default function StudentQuests() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const queryClient = useQueryClient();
  const [bouncing, setBouncing] = useState(false);
  const [inactivityMin, setInactivityMin] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [workingQuestId, setWorkingQuestId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean[]>>({});
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setBouncing(false);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetActivity));
    return () => events.forEach((e) => window.removeEventListener(e, resetActivity));
  }, [resetActivity]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000 / 60;
      if (elapsed >= inactivityMin) {
        setBouncing(true);
        sfx.nudge();
      }
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [inactivityMin]);

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["student-quests"],
    queryFn: async () => {
      if (isDemoMode) return demoQuests;
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  const completeQuest = useMutation({
    mutationFn: async (questId: string) => {
      if (isDemoMode) {
        toast.success("Quest completed! +40 XP ⚡ (Demo)");
        return;
      }
      const quest = quests.find((q) => q.id === questId);
      if (!quest) throw new Error("Quest not found");

      const { error } = await supabase
        .from("quests")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", questId);
      if (error) throw error;

      const { data: progress } = await supabase
        .from("gamification_progress")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (progress) {
        const newXp = progress.xp + quest.xp_reward;
        await supabase
          .from("gamification_progress")
          .update({
            xp: newXp,
            level: Math.floor(newXp / 100) + 1,
            momentum_score: Math.min(100, Number(progress.momentum_score) + 3),
          })
          .eq("user_id", user!.id);
      }
    },
    onSuccess: (_, questId) => {
      if (!isDemoMode) {
        const quest = quests.find((q) => q.id === questId);
        sfx.success();
        toast.success(`Quest completed! +${quest?.xp_reward || 0} XP ⚡`);
      }
      setWorkingQuestId(null);
      queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
    },
    onError: (e: any) => {
      sfx.error();
      toast.error(e.message);
    },
  });

  const activeQuests = quests.filter((q) => q.status === "active");
  const completedQuests = quests.filter((q) => q.status === "completed");

  const handleStartQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    const steps = parseSteps((quest as any)?.steps);
    setWorkingQuestId(questId);
    setCheckedSteps((prev) => ({ ...prev, [questId]: new Array(steps.length).fill(false) }));
    sfx.click();
    toast("Quest started! Complete each step, then finish.", { icon: "⚔️" });
  };

  const toggleStep = (questId: string, stepIndex: number) => {
    setCheckedSteps((prev) => {
      const arr = [...(prev[questId] || [])];
      arr[stepIndex] = !arr[stepIndex];
      return { ...prev, [questId]: arr };
    });
    sfx.click();
  };

  const allStepsChecked = (questId: string, stepCount: number) => {
    const arr = checkedSteps[questId];
    if (!arr || stepCount === 0) return true;
    return arr.length >= stepCount && arr.every(Boolean);
  };

  return (
    <div className="space-y-4" data-wizard-target="quests">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <Swords className="h-4 w-4" /> QUESTS
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="font-pixel text-[8px]"
          onClick={() => { setShowSettings(!showSettings); sfx.click(); }}
        >
          <Settings2 className="h-3.5 w-3.5 mr-1" /> SETTINGS
        </Button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card className="border-2 border-border">
              <CardContent className="py-3 space-y-2">
                <p className="font-pixel text-[9px] text-foreground">⏰ NUDGE TIMER</p>
                <p className="text-xs text-muted-foreground">
                  Quests will bounce after {inactivityMin} min{inactivityMin !== 1 ? "s" : ""} of inactivity
                </p>
                <Slider value={[inactivityMin]} onValueChange={([v]) => setInactivityMin(v)} min={1} max={10} step={1} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1 min</span>
                  <span>10 min</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {quests.length > 0 && <QuestPath3D quests={quests} />}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : activeQuests.length === 0 && completedQuests.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No quests yet! Submit some work and the AI will generate personalized challenges.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeQuests.length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-[9px] text-accent">⚔️ ACTIVE QUESTS</p>
              {activeQuests.map((quest, i) => {
                const isWorking = workingQuestId === quest.id;
                const steps = parseSteps((quest as any).steps);
                const isSideQuest = quest.type === "sidequest";

                return (
                  <motion.div
                    key={quest.id}
                    data-wizard-quest={i === 0 ? "first" : undefined}
                    initial={{ opacity: 0, x: -20 }}
                    animate={
                      bouncing && !isWorking
                        ? { opacity: 1, x: 0, y: [0, -8, 0, -4, 0], transition: { y: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } } }
                        : { opacity: 1, x: 0 }
                    }
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`border-2 transition-all ${
                      isWorking
                        ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
                        : bouncing
                          ? "border-warning/60 shadow-[0_0_12px_hsl(var(--warning)/0.3)]"
                          : isSideQuest
                            ? "border-warning/30"
                            : "border-accent/30"
                    }`}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-pixel text-[10px] text-foreground">{quest.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge className={TYPE_STYLES[quest.type] || ""} variant="outline">
                                {isSideQuest ? "🎈 side quest" : quest.type}
                              </Badge>
                              <span className="font-pixel text-[9px] text-warning">+{quest.xp_reward} XP</span>
                              {(quest as any).error_pattern?.startsWith("RECURRING:") && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[8px]">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> PATTERN
                                </Badge>
                              )}
                            </div>
                            {(quest as any).resource_url && (
                              <a
                                href={(quest as any).resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline font-pixel bg-primary/10 px-2 py-1 rounded border border-primary/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" /> 🔍 EXA STUDY RESOURCE ↗
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            {!isWorking ? (
                              <Button
                                size="sm"
                                className="font-pixel text-[8px]"
                                onClick={() => handleStartQuest(quest.id)}
                              >
                                <Play className="h-3 w-3 mr-1" /> START
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`font-pixel text-[8px] ${allStepsChecked(quest.id, steps.length) ? "border-primary text-primary" : "border-muted text-muted-foreground cursor-not-allowed opacity-50"}`}
                                onClick={() => completeQuest.mutate(quest.id)}
                                disabled={completeQuest.isPending || !allStepsChecked(quest.id, steps.length)}
                              >
                                {completeQuest.isPending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {allStepsChecked(quest.id, steps.length) ? "COMPLETE" : `${(checkedSteps[quest.id] || []).filter(Boolean).length}/${steps.length}`}
                              </Button>
                            )}
                            {isWorking && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="font-pixel text-[7px] text-muted-foreground"
                                onClick={() => setWorkingQuestId(null)}
                              >
                                PAUSE
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Steps — shown when working */}
                        <AnimatePresence>
                          {isWorking && steps.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 space-y-1.5 border-t border-border pt-3"
                            >
                              <p className="font-pixel text-[8px] text-accent mb-1">📋 QUEST STEPS — check each off when done</p>
                              {steps.map((step, si) => {
                                const isChecked = checkedSteps[quest.id]?.[si] || false;
                                return (
                                  <div key={si} className="space-y-0.5">
                                    <div
                                      className={`flex items-start gap-2 text-sm cursor-pointer p-1.5 rounded transition-colors ${isChecked ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                      onClick={() => toggleStep(quest.id, si)}
                                    >
                                      <Checkbox checked={isChecked} className="mt-0.5 shrink-0" />
                                      <span className={isChecked ? "text-foreground line-through opacity-60" : "text-muted-foreground"}>{step.text}</span>
                                    </div>
                                    {step.resource_url && (
                                      <a
                                        href={step.resource_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-7 inline-flex items-center gap-1 text-[9px] text-primary hover:underline font-pixel bg-primary/5 px-1.5 py-0.5 rounded border border-primary/15"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        {step.resource_title ? `📚 ${step.resource_title.slice(0, 40)}` : "📚 Study Resource"} ↗
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {completedQuests.length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-[9px] text-muted-foreground">✅ COMPLETED ({completedQuests.length})</p>
              {completedQuests.slice(0, 5).map((quest) => (
                <Card key={quest.id} className="border border-border opacity-60">
                  <CardContent className="py-2 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    <p className="font-pixel text-[9px] text-muted-foreground truncate">{quest.title}</p>
                    <span className="font-pixel text-[8px] text-success ml-auto">+{quest.xp_reward} XP</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

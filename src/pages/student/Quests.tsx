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
import { motion, AnimatePresence } from "framer-motion";
import { Swords, CheckCircle, Sparkles, Settings2, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { sfx } from "@/lib/retroSfx";

const TYPE_STYLES: Record<string, string> = {
  recovery: "bg-destructive/10 text-destructive border-destructive/30",
  growth: "bg-primary/10 text-primary border-primary/30",
};

export default function StudentQuests() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const queryClient = useQueryClient();
  const [bouncing, setBouncing] = useState(false);
  const [inactivityMin, setInactivityMin] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
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

  return (
    <div className="space-y-4">
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
              {activeQuests.map((quest, i) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={
                    bouncing
                      ? { opacity: 1, x: 0, y: [0, -8, 0, -4, 0], transition: { y: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } } }
                      : { opacity: 1, x: 0 }
                  }
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-2 ${bouncing ? "border-warning/60 shadow-[0_0_12px_hsl(var(--warning)/0.3)]" : "border-accent/30"} transition-all`}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-pixel text-[10px] text-foreground">{quest.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={TYPE_STYLES[quest.type] || ""} variant="outline">
                              {quest.type}
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
                              className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline font-pixel"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> STUDY RESOURCE
                            </a>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-pixel text-[8px] shrink-0"
                          onClick={() => completeQuest.mutate(quest.id)}
                          disabled={completeQuest.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> DONE
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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

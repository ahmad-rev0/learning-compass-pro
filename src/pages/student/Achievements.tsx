import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { demoGeneratedAchievements, demoBadgeUnlocks } from "@/lib/demoData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { sfx } from "@/lib/retroSfx";
import { toast } from "sonner";

const STATIC_BADGES = [
  { id: "first_submit", emoji: "🎯", name: "First Steps", desc: "Submit your first assignment" },
  { id: "streak_3", emoji: "🔥", name: "On Fire", desc: "3-day submission streak" },
  { id: "streak_7", emoji: "💎", name: "Diamond Streak", desc: "7-day submission streak" },
  { id: "perfect", emoji: "⭐", name: "Perfect Score", desc: "Score 100% on an assignment" },
  { id: "comeback", emoji: "🔄", name: "Comeback Kid", desc: "Recover from a momentum dip" },
  { id: "scholar", emoji: "📚", name: "Scholar", desc: "Submit 20 assignments" },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  bronze: "bg-amber-900/20 text-amber-600 border-amber-700/30",
  silver: "bg-slate-300/20 text-slate-400 border-slate-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  diamond: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  weakness_buster: "🔧 Weakness",
  strength_mastery: "💪 Mastery",
  exploration: "🧭 Explore",
  consistency: "📅 Consistency",
  comeback: "🔄 Comeback",
};

export default function StudentAchievements() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const queryClient = useQueryClient();

  const { data: unlocked = [] } = useQuery({
    queryKey: ["badge-unlocks"],
    queryFn: async () => {
      if (isDemoMode) return demoBadgeUnlocks;
      const { data, error } = await supabase
        .from("badge_unlocks")
        .select("badge_id, unlocked_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  const { data: generated = [], isLoading: loadingGenerated } = useQuery({
    queryKey: ["generated-achievements"],
    queryFn: async () => {
      if (isDemoMode) return demoGeneratedAchievements;
      const { data, error } = await supabase
        .from("generated_achievements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode) {
        toast.success("3 new achievements generated! 🏆 (Demo)");
        return { count: 3 };
      }
      const { data, error } = await supabase.functions.invoke("generate-achievements", {
        body: { user_id: user!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (!isDemoMode) {
        sfx.success();
        toast.success(`${data.count} new achievements generated! 🏆`);
      }
      queryClient.invalidateQueries({ queryKey: ["generated-achievements"] });
    },
    onError: (e: any) => {
      sfx.error();
      toast.error(e.message || "Failed to generate achievements");
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (isDemoMode) {
        toast.success("Achievement claimed! +40 XP ⚡ (Demo)");
        return;
      }
      const achievement = generated.find((a: any) => a.id === achievementId);
      if (!achievement) throw new Error("Not found");

      const { error } = await supabase
        .from("generated_achievements")
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq("id", achievementId);
      if (error) throw error;

      const { data: progress } = await supabase
        .from("gamification_progress")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (progress) {
        const newXp = progress.xp + (achievement as any).xp_reward;
        await supabase
          .from("gamification_progress")
          .update({ xp: newXp, level: Math.floor(newXp / 100) + 1 })
          .eq("user_id", user!.id);
      }
      return achievement;
    },
    onSuccess: (achievement: any) => {
      if (!isDemoMode) {
        sfx.success();
        toast.success(`Achievement claimed! +${achievement?.xp_reward} XP ⚡`);
      }
      queryClient.invalidateQueries({ queryKey: ["generated-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
    },
    onError: (e: any) => {
      sfx.error();
      toast.error(e.message);
    },
  });

  const unlockedIds = new Set(unlocked.map((u) => u.badge_id));
  const unclaimed = generated.filter((a: any) => !a.claimed);
  const claimed = generated.filter((a: any) => a.claimed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4" /> ACHIEVEMENTS
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="font-pixel text-[8px]"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> ANALYZING...</>
          ) : (
            <><Sparkles className="h-3 w-3 mr-1" /> GENERATE NEW</>
          )}
        </Button>
      </div>

      {unclaimed.length > 0 && (
        <div className="space-y-2">
          <p className="font-pixel text-[9px] text-accent">🤖 AI-TAILORED CHALLENGES</p>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {unclaimed.map((ach: any, i: number) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="border-2 border-accent/30 bg-accent/5 h-full">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <motion.span
                        className="text-2xl shrink-0"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }}
                      >
                        {ach.emoji}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-[10px] text-foreground">{ach.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ach.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className={DIFFICULTY_STYLES[ach.difficulty] || ""}>
                            {ach.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-[8px]">
                            {CATEGORY_LABELS[ach.category] || ach.category}
                          </Badge>
                          <span className="font-pixel text-[8px] text-warning">+{ach.xp_reward} XP</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {ach.resource_url && (
                            <a
                              href={ach.resource_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] text-primary hover:underline font-pixel"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> RESOURCE
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-pixel text-[8px] ml-auto h-6"
                            onClick={() => claimMutation.mutate(ach.id)}
                            disabled={claimMutation.isPending}
                          >
                            CLAIM ✓
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {claimed.length > 0 && (
        <div className="space-y-2">
          <p className="font-pixel text-[9px] text-muted-foreground">✅ EARNED ({claimed.length})</p>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {claimed.map((ach: any) => (
              <Card key={ach.id} className="border border-warning/30 bg-warning/5">
                <CardContent className="py-3 text-center">
                  <span className="text-2xl">{ach.emoji}</span>
                  <p className="font-pixel text-[8px] text-foreground mt-1 truncate">{ach.title}</p>
                  <p className="font-pixel text-[7px] text-warning mt-1">+{ach.xp_reward} XP</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="font-pixel text-[9px] text-muted-foreground">🏅 MILESTONE BADGES</p>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {STATIC_BADGES.map((badge, i) => {
            const isUnlocked = unlockedIds.has(badge.id);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`border-2 ${isUnlocked ? "border-warning/50 bg-warning/5" : "border-border opacity-50"}`}>
                  <CardContent className="py-3 text-center">
                    <motion.span
                      className="text-2xl inline-block"
                      animate={isUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                    >
                      {badge.emoji}
                    </motion.span>
                    <p className="font-pixel text-[9px] text-foreground mt-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
                    {isUnlocked ? (
                      <p className="font-pixel text-[7px] text-warning mt-1">✓ UNLOCKED</p>
                    ) : (
                      <p className="font-pixel text-[7px] text-muted-foreground mt-1">🔒 LOCKED</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

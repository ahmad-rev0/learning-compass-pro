import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Swords, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TYPE_STYLES: Record<string, string> = {
  recovery: "bg-destructive/10 text-destructive border-destructive/30",
  growth: "bg-primary/10 text-primary border-primary/30",
};

export default function StudentQuests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["student-quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completeQuest = useMutation({
    mutationFn: async (questId: string) => {
      const quest = quests.find((q) => q.id === questId);
      if (!quest) throw new Error("Quest not found");

      const { error } = await supabase
        .from("quests")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", questId);
      if (error) throw error;

      // Award XP
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
      const quest = quests.find((q) => q.id === questId);
      toast.success(`Quest completed! +${quest?.xp_reward || 0} XP ⚡`);
      queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeQuests = quests.filter((q) => q.status === "active");
  const completedQuests = quests.filter((q) => q.status === "completed");

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Swords className="h-4 w-4" /> QUESTS
      </h2>

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
              <p className="font-pixel text-[8px] text-accent">⚔️ ACTIVE QUESTS</p>
              {activeQuests.map((quest, i) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-2 border-accent/30">
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-pixel text-[9px] text-foreground">{quest.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={TYPE_STYLES[quest.type] || ""} variant="outline">
                              {quest.type}
                            </Badge>
                            <span className="font-pixel text-[7px] text-warning">+{quest.xp_reward} XP</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-pixel text-[7px] shrink-0"
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
              <p className="font-pixel text-[8px] text-muted-foreground">✅ COMPLETED ({completedQuests.length})</p>
              {completedQuests.slice(0, 5).map((quest) => (
                <Card key={quest.id} className="border border-border opacity-60">
                  <CardContent className="py-2 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    <p className="font-pixel text-[8px] text-muted-foreground truncate">{quest.title}</p>
                    <span className="font-pixel text-[7px] text-success ml-auto">+{quest.xp_reward} XP</span>
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

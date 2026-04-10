import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Loader2, Sparkles, CheckCircle, Target } from "lucide-react";
import { toast } from "sonner";
import { sfx } from "@/lib/retroSfx";

const FOCUS_STYLES: Record<string, string> = {
  weakness: "bg-destructive/10 text-destructive border-destructive/30",
  strength: "bg-primary/10 text-primary border-primary/30",
  exploration: "bg-accent/10 text-accent border-accent/30",
};

const DIFFICULTY_EMOJI: Record<string, string> = {
  beginner: "🌱",
  intermediate: "⚡",
  advanced: "🔥",
};

export default function StudentStudyPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: { user_id: user!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      sfx.success();
      toast.success("New study plan generated! 📚");
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },
    onError: (e: any) => {
      sfx.error();
      toast.error(e.message || "Failed to generate plan");
    },
  });

  const activePlan = plans.find((p: any) => p.status === "active");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> STUDY PLAN
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="font-pixel text-[8px]"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> PLANNING...</>
          ) : (
            <><Sparkles className="h-3 w-3 mr-1" /> NEW PLAN</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !activePlan ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No study plan yet. Click "NEW PLAN" to let the agent create a personalized weekly study plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Plan header */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{DIFFICULTY_EMOJI[activePlan.difficulty_level] || "⚡"}</span>
                <div>
                  <p className="font-pixel text-[10px] text-foreground">{(activePlan as any).title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{activePlan.difficulty_level}</Badge>
                    <span className="text-[9px] text-muted-foreground">
                      Week of {new Date((activePlan as any).week_start).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Progress value={activePlan.progress_pct} className="h-2 mt-2" />
              <p className="text-[9px] text-muted-foreground mt-1">{activePlan.progress_pct}% complete</p>
            </CardContent>
          </Card>

          {/* Agent reasoning */}
          {(activePlan as any).agent_reasoning && (
            <Card className="border border-accent/20 bg-accent/5">
              <CardContent className="py-3">
                <p className="font-pixel text-[8px] text-accent mb-1">🧠 AGENT REASONING</p>
                <p className="text-xs text-muted-foreground">{(activePlan as any).agent_reasoning}</p>
              </CardContent>
            </Card>
          )}

          {/* Daily topics */}
          <div className="space-y-2">
            <p className="font-pixel text-[9px] text-accent">📅 DAILY TOPICS</p>
            {((activePlan.topics as any[]) || []).map((topic: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border border-border">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-pixel text-[9px] text-foreground">{topic.day}</span>
                          <Badge variant="outline" className={FOCUS_STYLES[topic.focus] || ""}>
                            {topic.focus}
                          </Badge>
                          <span className="text-[8px] text-muted-foreground">{topic.duration_min}min</span>
                        </div>
                        <p className="text-xs text-foreground mt-1">{topic.topic}</p>
                        {topic.resource_url && (
                          <a
                            href={topic.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[9px] text-primary hover:underline font-pixel"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            {topic.resource_title?.slice(0, 40) || "RESOURCE"}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Milestones */}
          {((activePlan.milestones as any[]) || []).length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-[9px] text-warning">🎯 MILESTONES</p>
              {((activePlan.milestones as any[]) || []).map((m: any, i: number) => (
                <Card key={i} className="border border-warning/20">
                  <CardContent className="py-2 flex items-center gap-2">
                    <Target className="h-3 w-3 text-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-[9px] text-foreground">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                    </div>
                    <span className="font-pixel text-[8px] text-warning shrink-0">+{m.xp_bonus} XP</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Inbox, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  graded: "bg-success/10 text-success border-success/30",
  reviewed: "bg-primary/10 text-primary border-primary/30",
};

export default function TeacherSubmissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["teacher-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, assignments(title, type), profiles:student_id(display_name)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const gradeWithAI = useMutation({
    mutationFn: async (submissionId: string) => {
      setGradingId(submissionId);
      const { data, error } = await supabase.functions.invoke("grade-submission", {
        body: { submission_id: submissionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGradingId(null);
      toast.success(`AI graded: ${data.grade.score} pts | +${data.xp_earned} XP for student`);
      queryClient.invalidateQueries({ queryKey: ["teacher-submissions"] });
    },
    onError: (e: any) => {
      setGradingId(null);
      toast.error(e.message || "Grading failed");
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Inbox className="h-4 w-4" /> SUBMISSIONS
      </h2>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : submissions.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center text-muted-foreground">No submissions yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {submissions.map((s: any, i: number) => {
            const feedback = s.ai_feedback as any;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-2 border-border">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-[9px] text-foreground truncate">
                          {s.profiles?.display_name || "Unknown"} → {s.assignments?.title || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[7px]">{s.assignments?.type}</Badge>
                          <Badge className={`text-[7px] ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                          {s.score !== null && (
                            <span className="text-xs text-muted-foreground">Score: {s.score}</span>
                          )}
                        </div>
                        {s.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.content}</p>
                        )}

                        {/* AI Feedback inline */}
                        {feedback && (
                          <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20 text-xs">
                            <p className="font-pixel text-[7px] text-primary mb-1">🤖 AI FEEDBACK</p>
                            <p className="text-muted-foreground">{feedback.feedback}</p>
                            {feedback.momentum_impact && (
                              <span className={`font-pixel text-[7px] mt-1 inline-block ${
                                feedback.momentum_impact === "boost" ? "text-success" :
                                feedback.momentum_impact === "concern" ? "text-destructive" : "text-muted-foreground"
                              }`}>
                                {feedback.momentum_impact === "boost" ? "🚀 BOOST" :
                                 feedback.momentum_impact === "concern" ? "⚠️ CONCERN" : "➡️ STEADY"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.submitted_at).toLocaleDateString()}
                        </span>
                        {s.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-pixel text-[7px]"
                            onClick={() => gradeWithAI.mutate(s.id)}
                            disabled={gradingId === s.id}
                          >
                            {gradingId === s.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> GRADING</>
                            ) : (
                              <><Bot className="h-3 w-3 mr-1" /> AI GRADE</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

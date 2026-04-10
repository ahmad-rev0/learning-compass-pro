import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Flame, Star, Target } from "lucide-react";

export default function StudentProgress() {
  const { user } = useAuth();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["student-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_progress")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("status, score")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.status === "graded").length;
  const avgScore = gradedSubmissions > 0
    ? submissions.filter((s) => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions
    : 0;

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  const xpForNext = (progress?.level || 1) * 100;
  const xpProgress = progress ? ((progress.xp % xpForNext) / xpForNext) * 100 : 0;

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4" /> MY PROGRESS
      </h2>

      {/* Level & XP card */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-4xl"
            >
              ⭐
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-xs text-foreground">LEVEL {progress?.level || 1}</span>
                <span className="text-xs text-muted-foreground">{progress?.xp || 0} XP</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {xpForNext - ((progress?.xp || 0) % xpForNext)} XP to next level
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Zap className="h-5 w-5 text-warning" />}
          label="TOTAL XP"
          value={(progress?.xp || 0).toLocaleString()}
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-destructive" />}
          label="STREAK"
          value={`${progress?.streak_days || 0} days`}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-primary" />}
          label="MOMENTUM"
          value={`${Number(progress?.momentum_score || 50).toFixed(0)}%`}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-accent" />}
          label="AVG SCORE"
          value={avgScore > 0 ? `${avgScore.toFixed(0)}%` : "—"}
        />
      </div>

      {/* Momentum gauge */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px]">📊 MOMENTUM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🐌 Stuck</span>
              <span>🚀 Thriving</span>
            </div>
            <Progress value={Number(progress?.momentum_score || 50)} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Submission stats */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px]">📝 SUBMISSION HISTORY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-pixel text-sm text-foreground">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="font-pixel text-sm text-success">{gradedSubmissions}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
            <div>
              <p className="font-pixel text-sm text-warning">{totalSubmissions - gradedSubmissions}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-2 border-border">
      <CardContent className="py-3 flex flex-col items-center gap-1 text-center">
        {icon}
        <p className="font-pixel text-[8px] text-muted-foreground">{label}</p>
        <p className="font-pixel text-xs text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

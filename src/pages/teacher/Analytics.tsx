import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BarChart3, Flame, TrendingUp, Zap } from "lucide-react";

export default function TeacherAnalytics() {
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["teacher-student-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_progress")
        .select("*, profiles:user_id(display_name)")
        .order("xp", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalXP = students.reduce((sum, s) => sum + s.xp, 0);
  const avgMomentum = students.length
    ? students.reduce((sum, s) => sum + Number(s.momentum_score), 0) / students.length
    : 0;
  const activeStudents = students.filter(
    (s) => s.last_activity_at && Date.now() - new Date(s.last_activity_at).getTime() < 7 * 86400000
  ).length;

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <BarChart3 className="h-4 w-4" /> ANALYTICS
      </h2>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Zap className="h-4 w-4 text-warning" />} label="TOTAL XP" value={totalXP.toLocaleString()} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="AVG MOMENTUM" value={`${avgMomentum.toFixed(1)}%`} />
        <StatCard icon={<Flame className="h-4 w-4 text-destructive" />} label="ACTIVE (7D)" value={`${activeStudents}/${students.length}`} />
        <StatCard icon={<BarChart3 className="h-4 w-4 text-accent" />} label="STUDENTS" value={students.length.toString()} />
      </div>

      {/* Student leaderboard */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[9px]">🏆 STUDENT LEADERBOARD</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No student data yet.</p>
          ) : (
            <div className="space-y-3">
              {students.map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="font-pixel text-[10px] text-muted-foreground w-6 text-right">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground truncate">
                        {s.profiles?.display_name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Lv.{s.level} · {s.xp} XP · 🔥{s.streak_days}d
                      </span>
                    </div>
                    <Progress value={Number(s.momentum_score)} className="h-2" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-2 border-border">
      <CardContent className="py-3 flex items-center gap-2">
        {icon}
        <div>
          <p className="font-pixel text-[7px] text-muted-foreground">{label}</p>
          <p className="font-pixel text-[10px] text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { StatsResponse } from "@/lib/api";

interface StatsBarProps {
  stats: StatsResponse | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  const xpToNext = stats.total_xp % 100;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {/* XP with circular progress */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total XP</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-end gap-1">
            <motion.span
              key={stats.total_xp}
              initial={{ scale: 1.3, color: "hsl(160, 84%, 45%)" }}
              animate={{ scale: 1, color: "hsl(var(--primary))" }}
              className="text-3xl font-bold text-primary"
            >
              {stats.total_xp}
            </motion.span>
            <span className="mb-1 text-xs text-muted-foreground">XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Level */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Level</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-3xl font-bold text-accent">{stats.level}</p>
          <Progress value={xpToNext} className="mt-1 h-1" />
          <p className="mt-1 text-[10px] text-muted-foreground">{xpToNext}/100 to next</p>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-transparent">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Streak</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-1">
            <motion.span
              animate={stats.streak >= 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-3xl font-bold text-warning"
            >
              {stats.streak}
            </motion.span>
            {stats.streak >= 3 && <span className="text-xl">🔥</span>}
          </div>
        </CardContent>
      </Card>

      {/* Active Quests */}
      <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-transparent">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Quests</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-3xl font-bold text-destructive">{stats.active_quests}</p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="border-success/20 bg-gradient-to-br from-success/10 to-transparent">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Completed</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-3xl font-bold text-success">{stats.completed_quests}</p>
        </CardContent>
      </Card>
    </div>
  );
}

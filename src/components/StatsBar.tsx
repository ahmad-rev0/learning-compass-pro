import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { StatsResponse } from "@/lib/api";

interface StatsBarProps {
  stats: StatsResponse | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  const xpToNext = stats.total_xp % 100;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Total XP</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold text-primary">{stats.total_xp}</p>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Level</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold text-accent">{stats.level}</p>
          <Progress value={xpToNext} className="mt-2 h-1.5" />
        </CardContent>
      </Card>

      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Streak</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold text-warning">{stats.streak} 🔥</p>
        </CardContent>
      </Card>

      <Card className="border-success/20 bg-success/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Quests Done</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold text-success">{stats.completed_quests}</p>
        </CardContent>
      </Card>
    </div>
  );
}

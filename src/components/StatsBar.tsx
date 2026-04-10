import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { StatsResponse } from "@/lib/api";

interface StatsBarProps {
  stats: StatsResponse | null;
}

function HPBar({ value, max, color }: { value: number; max: number; color: "green" | "yellow" | "red" }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorClass = color === "green" ? "hp-green" : color === "yellow" ? "hp-yellow" : "hp-red";
  return (
    <div className="hp-bar">
      <div className={`hp-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  const xpToNext = stats.total_xp % 100;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {/* XP */}
      <Card className="pixel-card pixel-card-glow-green">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">✧ TOTAL XP</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <motion.div
            key={stats.total_xp}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-3xl font-pixel text-primary"
          >
            {stats.total_xp}
          </motion.div>
          <span className="text-sm text-muted-foreground">experience pts</span>
        </CardContent>
      </Card>

      {/* Level */}
      <Card className="pixel-card pixel-card-glow-purple">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">★ LEVEL</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-3xl font-pixel text-accent">{stats.level}</p>
          <HPBar value={xpToNext} max={100} color="green" />
          <p className="mt-1 text-sm text-muted-foreground">{xpToNext}/100 to next</p>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="pixel-card pixel-card-glow-gold">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">🔥 STREAK</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center gap-2">
            <motion.span
              animate={stats.streak >= 5 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-3xl font-pixel text-warning"
            >
              {stats.streak}
            </motion.span>
            {stats.streak >= 3 && <span className="text-xl animate-pixel-float">🔥</span>}
          </div>
        </CardContent>
      </Card>

      {/* Active */}
      <Card className="pixel-card">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">⚔ ACTIVE</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-3xl font-pixel text-destructive">{stats.active_quests}</p>
          <span className="text-sm text-muted-foreground">quests</span>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="pixel-card pixel-card-glow-green">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">✓ DONE</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-3xl font-pixel text-primary">{stats.completed_quests}</p>
          <span className="text-sm text-muted-foreground">completed</span>
        </CardContent>
      </Card>
    </div>
  );
}

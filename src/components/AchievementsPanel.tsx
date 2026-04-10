import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { Achievement } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span>🏅</span> Achievements
          </div>
          <span className="text-xs font-mono text-muted-foreground">{unlocked}/{total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2.5 transition-all",
              a.unlocked ? "bg-primary/5 border border-primary/20" : "bg-muted/30 opacity-50"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg",
              a.unlocked ? "bg-primary/10" : "bg-muted grayscale"
            )}>
              {a.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-semibold", a.unlocked ? "text-foreground" : "text-muted-foreground")}>
                {a.title}
              </p>
              <p className="text-[10px] text-muted-foreground">{a.description}</p>
            </div>
            {a.unlocked && a.unlockedAt && (
              <span className="text-[9px] text-primary shrink-0">{a.unlockedAt}</span>
            )}
            {!a.unlocked && (
              <span className="text-[10px] text-muted-foreground">🔒</span>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

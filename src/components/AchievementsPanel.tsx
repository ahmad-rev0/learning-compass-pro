import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { Achievement } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  return (
    <Card className="pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center justify-between">
          <div className="flex items-center gap-2">🏅 BADGES</div>
          <span className="font-pixel text-[8px] text-muted-foreground">{unlocked}/{total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-2.5 transition-all border-2",
              a.unlocked
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/20 opacity-40 grayscale"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center border-2 text-lg",
              a.unlocked ? "border-primary/30 bg-primary/10" : "border-border bg-muted"
            )}>
              <span className={a.unlocked ? "animate-pixel-float" : ""}>{a.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "font-pixel text-[7px]",
                a.unlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {a.title}
              </p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </div>
            {a.unlocked && a.unlockedAt && (
              <span className="text-xs text-primary shrink-0">{a.unlockedAt}</span>
            )}
            {!a.unlocked && (
              <span className="font-pixel text-[8px] text-muted-foreground">🔒</span>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

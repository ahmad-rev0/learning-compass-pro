import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

const BADGES = [
  { id: "first_submit", emoji: "🎯", name: "First Steps", desc: "Submit your first assignment", unlocked: false },
  { id: "streak_3", emoji: "🔥", name: "On Fire", desc: "3-day submission streak", unlocked: false },
  { id: "streak_7", emoji: "💎", name: "Diamond Streak", desc: "7-day submission streak", unlocked: false },
  { id: "perfect", emoji: "⭐", name: "Perfect Score", desc: "Score 100% on an assignment", unlocked: false },
  { id: "bug_slayer", emoji: "🐛", name: "Bug Slayer", desc: "Fix 5 code errors", unlocked: false },
  { id: "comeback", emoji: "🔄", name: "Comeback Kid", desc: "Recover from a momentum dip", unlocked: false },
  { id: "quest_master", emoji: "⚔️", name: "Quest Master", desc: "Complete 10 quests", unlocked: false },
  { id: "scholar", emoji: "📚", name: "Scholar", desc: "Submit 20 assignments", unlocked: false },
];

export default function StudentAchievements() {
  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Trophy className="h-4 w-4" /> ACHIEVEMENTS
      </h2>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {BADGES.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`border-2 ${badge.unlocked ? "border-warning/50 bg-warning/5" : "border-border opacity-50"}`}>
              <CardContent className="py-4 text-center">
                <span className="text-3xl">{badge.emoji}</span>
                <p className="font-pixel text-[8px] text-foreground mt-2">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.desc}</p>
                {badge.unlocked ? (
                  <p className="font-pixel text-[7px] text-warning mt-2">✓ UNLOCKED</p>
                ) : (
                  <p className="font-pixel text-[7px] text-muted-foreground mt-2">🔒 LOCKED</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-2 border-dashed border-accent/30">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          🔮 Achievements will unlock automatically as you submit work and complete quests (Phase 4+5).
        </CardContent>
      </Card>
    </div>
  );
}

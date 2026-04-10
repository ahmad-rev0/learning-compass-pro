import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { sfx } from "@/lib/retroSfx";

const BADGES = [
  { id: "first_submit", emoji: "🎯", name: "First Steps", desc: "Submit your first assignment" },
  { id: "streak_3", emoji: "🔥", name: "On Fire", desc: "3-day submission streak" },
  { id: "streak_7", emoji: "💎", name: "Diamond Streak", desc: "7-day submission streak" },
  { id: "perfect", emoji: "⭐", name: "Perfect Score", desc: "Score 100% on an assignment" },
  { id: "bug_slayer", emoji: "🐛", name: "Bug Slayer", desc: "Fix 5 code errors" },
  { id: "comeback", emoji: "🔄", name: "Comeback Kid", desc: "Recover from a momentum dip" },
  { id: "quest_master", emoji: "⚔️", name: "Quest Master", desc: "Complete 10 quests" },
  { id: "scholar", emoji: "📚", name: "Scholar", desc: "Submit 20 assignments" },
];

export default function StudentAchievements() {
  const { user } = useAuth();

  const { data: unlocked = [] } = useQuery({
    queryKey: ["badge-unlocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_unlocks")
        .select("badge_id, unlocked_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unlockedIds = new Set(unlocked.map((u) => u.badge_id));

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
        <Trophy className="h-4 w-4" /> ACHIEVEMENTS
      </h2>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {BADGES.map((badge, i) => {
          const isUnlocked = unlockedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`border-2 ${isUnlocked ? "border-warning/50 bg-warning/5" : "border-border opacity-50"}`}>
                <CardContent className="py-4 text-center">
                  <motion.span
                    className="text-3xl inline-block"
                    animate={isUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                  >
                    {badge.emoji}
                  </motion.span>
                  <p className="font-pixel text-[9px] text-foreground mt-2">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.desc}</p>
                  {isUnlocked ? (
                    <p className="font-pixel text-[7px] text-warning mt-2">✓ UNLOCKED</p>
                  ) : (
                    <p className="font-pixel text-[7px] text-muted-foreground mt-2">🔒 LOCKED</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

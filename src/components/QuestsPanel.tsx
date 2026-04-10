import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import type { Quest } from "@/lib/api";

interface QuestsPanelProps {
  active: Quest[];
  completed: Quest[];
}

export function QuestsPanel({ active, completed }: QuestsPanelProps) {
  return (
    <Card className="flex flex-col pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center gap-2">
          ⚔ QUEST LOG
          {active.length > 0 && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Badge className="font-pixel text-[7px] bg-primary/20 text-primary">{active.length}</Badge>
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {active.length === 0 && completed.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No quests yet... Press START!
            </p>
          )}
          <AnimatePresence mode="popLayout">
            {active.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <QuestCard quest={q} />
              </motion.div>
            ))}
          </AnimatePresence>
          {completed.length > 0 && (
            <div className="mt-4 border-t-2 border-border pt-3">
              <p className="font-pixel text-[7px] text-muted-foreground mb-2">✓ COMPLETED</p>
              {completed.slice(0, 5).map((q) => (
                <QuestCard key={q.id} quest={q} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const isActive = quest.status === "active";
  const stateEmojis: Record<string, string> = {
    micro_stuck: "⚠️",
    momentum_dip: "📉",
    double_trouble: "🔥",
  };
  const borderColors: Record<string, string> = {
    micro_stuck: "border-l-warning",
    momentum_dip: "border-l-accent",
    double_trouble: "border-l-destructive",
  };

  return (
    <div className={cn(
      "mb-3 border-2 border-border bg-secondary/30 p-3 transition-all border-l-4",
      borderColors[quest.state] || "border-l-border",
      !isActive && "opacity-40",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span>{stateEmojis[quest.state] || "📋"}</span>
            <p className="truncate font-pixel text-[8px] leading-relaxed">{quest.title}</p>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{quest.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={isActive ? "default" : "secondary"} className="font-pixel text-[7px]">
            {isActive ? "ACTIVE" : "✓ DONE"}
          </Badge>
          <span className="font-pixel text-[9px] text-primary">+{quest.xp_reward} XP</span>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 space-y-1.5">
          {quest.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-border bg-muted font-pixel text-[7px] text-muted-foreground">
                {i + 1}
              </div>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      )}

      {quest.exa_result && quest.resource_url && (
        <div className="mt-3 border-2 border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-center gap-1.5 font-pixel text-[7px] text-primary">
            🔍 EXA AI RESOURCE
          </div>
          <a href={quest.resource_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-foreground hover:text-primary transition-colors">
            {quest.exa_result.title || quest.resource_url}
          </a>
          {quest.exa_result.snippet && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{quest.exa_result.snippet}</p>
          )}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

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
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>⚔️</span> Active Quests
          {active.length > 0 && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Badge className="bg-primary/20 text-primary">{active.length}</Badge>
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-6 pb-4">
          {active.length === 0 && completed.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No quests yet. Start the simulation!</p>
          )}
          <AnimatePresence mode="popLayout">
            {active.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <QuestCard quest={q} />
              </motion.div>
            ))}
          </AnimatePresence>
          {completed.length > 0 && (
            <div className="mt-4 border-t border-border/50 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">COMPLETED</p>
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
  const stateColors: Record<string, string> = {
    micro_stuck: "border-l-warning",
    momentum_dip: "border-l-accent",
    double_trouble: "border-l-destructive",
  };

  return (
    <div className={`mb-3 rounded-lg border border-border/50 bg-secondary/30 p-4 transition-all ${!isActive ? "opacity-50" : ""} border-l-4 ${stateColors[quest.state] || "border-l-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span>{stateEmojis[quest.state] || "📋"}</span>
            <p className="truncate font-semibold text-sm">{quest.title}</p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{quest.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
            {isActive ? "ACTIVE" : "✓ DONE"}
          </Badge>
          <span className="text-sm font-bold font-mono text-primary">+{quest.xp_reward} XP</span>
        </div>
      </div>

      {/* Quest steps */}
      {isActive && (
        <div className="mt-3 space-y-1.5">
          {quest.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[9px] font-bold text-muted-foreground">
                {i + 1}
              </div>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Exa resource */}
      {quest.exa_result && quest.resource_url && (
        <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            <span>🔍</span> Exa AI Resource
          </div>
          <a href={quest.resource_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs font-medium text-foreground hover:text-primary transition-colors">
            {quest.exa_result.title || quest.resource_url}
          </a>
          {quest.exa_result.snippet && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{quest.exa_result.snippet}</p>
          )}
        </div>
      )}
    </div>
  );
}

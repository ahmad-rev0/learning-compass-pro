import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          <span>⚔️</span> Quests
          {active.length > 0 && <Badge className="bg-primary/20 text-primary">{active.length} active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-6">
          {active.length === 0 && completed.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No quests yet. Start the simulation!</p>
          )}
          {active.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
          {completed.slice(-5).reverse().map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const isActive = quest.status === "active";
  const stateColors: Record<string, string> = {
    micro_stuck: "border-warning/30",
    momentum_dip: "border-accent/30",
    double_trouble: "border-destructive/30",
  };

  return (
    <div className={`mb-3 rounded-md border p-3 ${stateColors[quest.state] || "border-border"} ${!isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{quest.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{quest.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
            {isActive ? "ACTIVE" : "DONE ✓"}
          </Badge>
          <span className="text-xs font-mono text-primary">+{quest.xp_reward} XP</span>
        </div>
      </div>
      {quest.resource_url && (
        <a href={quest.resource_url} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-xs text-primary hover:underline">
          📎 {quest.resource_url}
        </a>
      )}
    </div>
  );
}

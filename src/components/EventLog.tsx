import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { EventEntry } from "@/lib/api";
import { useEffect, useRef } from "react";

interface EventLogProps {
  events: EventEntry[];
}

const stateIcon: Record<string, string> = {
  normal: "·",
  micro_stuck: "⚠",
  momentum_dip: "📉",
  double_trouble: "🔥",
};

const stateBg: Record<string, string> = {
  normal: "",
  micro_stuck: "bg-warning/5",
  momentum_dip: "bg-accent/5",
  double_trouble: "bg-destructive/5",
};

export function EventLog({ events }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span>📋</span> Live Event Stream
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{events.length} events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[280px] px-6">
          {events.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Waiting for events…</p>
          )}
          {events.map((e, i) => (
            <div key={i} className={cn(
              "flex items-center gap-2 border-b border-border/30 py-1.5 font-mono text-[11px]",
              stateBg[e.state],
            )}>
              <span className="w-7 shrink-0 text-right text-muted-foreground/60">#{e.tick}</span>
              <span className="w-4 shrink-0 text-center">{stateIcon[e.state]}</span>
              <span className="w-24 shrink-0 truncate text-muted-foreground">{e.topic}</span>
              {e.error_type && <span className="rounded bg-destructive/10 px-1 text-destructive">{e.error_type}</span>}
              {e.quiz_score != null && <span className="rounded bg-accent/10 px-1 text-accent">Q:{e.quiz_score.toFixed(0)}</span>}
              {e.quest_generated && <span className="truncate rounded bg-primary/10 px-1 text-primary">→ {e.quest_generated}</span>}
            </div>
          ))}
          <div ref={bottomRef} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

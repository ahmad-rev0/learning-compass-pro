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

const stateTextColor: Record<string, string> = {
  normal: "text-muted-foreground",
  micro_stuck: "text-warning",
  momentum_dip: "text-accent",
  double_trouble: "text-destructive",
};

export function EventLog({ events }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">📋 Event Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-6">
          {events.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Waiting for events…</p>
          )}
          {events.map((e, i) => (
            <div key={i} className={cn("flex gap-2 border-b border-border/50 py-2 font-mono text-xs", stateTextColor[e.state])}>
              <span className="w-8 shrink-0 text-right text-muted-foreground">#{e.tick}</span>
              <span className="w-5 shrink-0 text-center">{stateIcon[e.state]}</span>
              <span className="shrink-0 text-muted-foreground">{e.topic}</span>
              {e.error_type && <span className="text-destructive">ERR:{e.error_type}</span>}
              {e.quiz_score != null && <span className="text-accent">Q:{e.quiz_score.toFixed(0)}</span>}
              {e.quest_generated && <span className="text-primary">→ {e.quest_generated}</span>}
            </div>
          ))}
          <div ref={bottomRef} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

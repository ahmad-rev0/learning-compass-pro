import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  normal: { label: "Normal", color: "text-success bg-success/10 border-success/30", icon: "✅" },
  micro_stuck: { label: "Micro-Stuck", color: "text-warning bg-warning/10 border-warning/30", icon: "⚠️" },
  momentum_dip: { label: "Momentum Dip", color: "text-accent bg-accent/10 border-accent/30", icon: "📉" },
  double_trouble: { label: "Double Trouble", color: "text-destructive bg-destructive/10 border-destructive/30", icon: "🔥" },
};

interface StateIndicatorProps {
  state: string;
  topic: string;
  studentName: string;
  isRunning: boolean;
}

export function StateIndicator({ state, topic, studentName, isRunning }: StateIndicatorProps) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.normal;

  return (
    <div className={cn("rounded-lg border-2 p-6 transition-all duration-500", config.color)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Student: {studentName}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">{config.label}</h2>
              <p className="text-sm text-muted-foreground">Topic: <span className="font-mono text-foreground">{topic}</span></p>
            </div>
          </div>
        </div>
        <Badge variant={isRunning ? "default" : "secondary"} className={cn("text-xs", isRunning && "pulse-glow")}>
          {isRunning ? "● LIVE" : "○ PAUSED"}
        </Badge>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MomentumChartProps {
  stateHistory: { tick: number; state: string }[];
}

const stateValues: Record<string, number> = {
  normal: 0,
  micro_stuck: 1,
  momentum_dip: 2,
  double_trouble: 3,
};

const stateColors: Record<string, string> = {
  normal: "bg-primary",
  micro_stuck: "bg-warning",
  momentum_dip: "bg-accent",
  double_trouble: "bg-destructive",
};

export function MomentumChart({ stateHistory }: MomentumChartProps) {
  const last40 = stateHistory.slice(-40);

  return (
    <Card className="pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center gap-2">
          📈 STATE TIMELINE
        </CardTitle>
      </CardHeader>
      <CardContent>
        {last40.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">No state data yet...</p>
        ) : (
          <div className="space-y-3">
            {/* Pixel bar chart */}
            <div className="flex items-end gap-[2px] h-20 border-b-2 border-l-2 border-border p-1">
              {last40.map((s, i) => {
                const height = ((stateValues[s.state] + 1) / 4) * 100;
                return (
                  <div
                    key={i}
                    className={cn("flex-1 transition-all", stateColors[s.state])}
                    style={{ height: `${height}%`, minWidth: '3px' }}
                    title={`Tick ${s.tick}: ${s.state}`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(stateColors).map(([state, color]) => (
                <div key={state} className="flex items-center gap-1.5">
                  <div className={cn("h-3 w-3 border border-border", color)} />
                  <span className="text-xs text-muted-foreground">{state.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

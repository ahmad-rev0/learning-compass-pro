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
  normal: "bg-success",
  micro_stuck: "bg-warning",
  momentum_dip: "bg-accent",
  double_trouble: "bg-destructive",
};

export function MomentumChart({ stateHistory }: MomentumChartProps) {
  const last30 = stateHistory.slice(-40);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📈</span> State Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {last30.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No state changes yet</p>
        ) : (
          <div className="space-y-3">
            {/* Bar chart */}
            <div className="flex items-end gap-[2px] h-20">
              {last30.map((s, i) => {
                const height = ((stateValues[s.state] + 1) / 4) * 100;
                return (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-t-sm transition-all", stateColors[s.state])}
                    style={{ height: `${height}%`, minWidth: '3px' }}
                    title={`Tick ${s.tick}: ${s.state}`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[10px]">
              {Object.entries(stateColors).map(([state, color]) => (
                <div key={state} className="flex items-center gap-1">
                  <div className={cn("h-2 w-2 rounded-full", color)} />
                  <span className="text-muted-foreground">{state.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlsPanelProps {
  isRunning: boolean;
  connected: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onTrigger: (state: string) => void;
}

export function ControlsPanel({ isRunning, connected, onStart, onStop, onReset, onTrigger }: ControlsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">🎮 Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onStart} disabled={isRunning || !connected} size="sm">
            ▶ Start
          </Button>
          <Button onClick={onStop} disabled={!isRunning || !connected} variant="secondary" size="sm">
            ⏸ Stop
          </Button>
          <Button onClick={onReset} disabled={!connected} variant="outline" size="sm">
            ↺ Reset
          </Button>
        </div>
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs text-muted-foreground">Force-trigger state:</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onTrigger("micro_stuck")} variant="outline" size="sm" disabled={!connected} className="border-warning/40 text-warning hover:bg-warning/10">
              ⚠️ Micro-Stuck
            </Button>
            <Button onClick={() => onTrigger("momentum_dip")} variant="outline" size="sm" disabled={!connected} className="border-accent/40 text-accent hover:bg-accent/10">
              📉 Momentum Dip
            </Button>
            <Button onClick={() => onTrigger("double_trouble")} variant="outline" size="sm" disabled={!connected} className="border-destructive/40 text-destructive hover:bg-destructive/10">
              🔥 Double Trouble
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

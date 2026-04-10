import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ControlsPanelProps {
  isRunning: boolean;
  connected: boolean;
  demoMode: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onTrigger: (state: string) => void;
}

export function ControlsPanel({ isRunning, connected, demoMode, onStart, onStop, onReset, onTrigger }: ControlsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span>🎮</span> Agent Controls
          </div>
          {demoMode && <Badge variant="outline" className="text-[10px] text-accent">Demo</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulation controls */}
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Simulation</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onStart} disabled={isRunning} size="sm" className="gap-1.5">
              <span>▶</span> Start
            </Button>
            <Button onClick={onStop} disabled={!isRunning} variant="secondary" size="sm" className="gap-1.5">
              <span>⏸</span> Stop
            </Button>
            <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
              <span>↺</span> Reset
            </Button>
          </div>
        </div>

        {/* Force trigger */}
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Force Agent Trigger</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => onTrigger("micro_stuck")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-warning/30 text-warning hover:bg-warning/10"
            >
              ⚠️ Micro-Stuck
              <span className="ml-auto text-[10px] opacity-60">+30 XP quest</span>
            </Button>
            <Button
              onClick={() => onTrigger("momentum_dip")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-accent/30 text-accent hover:bg-accent/10"
            >
              📉 Momentum Dip
              <span className="ml-auto text-[10px] opacity-60">+50 XP quest</span>
            </Button>
            <Button
              onClick={() => onTrigger("double_trouble")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              🔥 Double Trouble
              <span className="ml-auto text-[10px] opacity-60">+100 XP quest</span>
            </Button>
          </div>
        </div>

        {/* Connection info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Connection</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connected ? "bg-success" : demoMode ? "bg-accent" : "bg-destructive"}`} />
            <span className="text-xs text-foreground">
              {connected ? "Backend connected" : demoMode ? "Demo mode (client-side)" : "Disconnected"}
            </span>
          </div>
          {!connected && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Backend: set <code className="font-mono text-accent">VITE_API_URL</code>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

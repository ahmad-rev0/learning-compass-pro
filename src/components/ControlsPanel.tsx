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
    <Card className="pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center justify-between">
          <div className="flex items-center gap-2">🎮 CONTROLS</div>
          {demoMode && <Badge variant="outline" className="font-pixel text-[7px] text-accent">DEMO</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulation controls */}
        <div>
          <p className="font-pixel text-[7px] text-muted-foreground mb-2">SIMULATION</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onStart} disabled={isRunning} size="sm" className="font-pixel text-[8px] gap-1.5">
              ► START
            </Button>
            <Button onClick={onStop} disabled={!isRunning} variant="secondary" size="sm" className="font-pixel text-[8px] gap-1.5">
              ❚❚ STOP
            </Button>
            <Button onClick={onReset} variant="outline" size="sm" className="font-pixel text-[8px] gap-1.5">
              ↺ RESET
            </Button>
          </div>
        </div>

        {/* Force triggers */}
        <div>
          <p className="font-pixel text-[7px] text-muted-foreground mb-2">FORCE TRIGGER</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => onTrigger("micro_stuck")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-warning/30 text-warning hover:bg-warning/10 text-sm"
            >
              ⚠️ Micro-Stuck
              <span className="ml-auto font-pixel text-[7px] opacity-60">+30 XP</span>
            </Button>
            <Button
              onClick={() => onTrigger("momentum_dip")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-accent/30 text-accent hover:bg-accent/10 text-sm"
            >
              📉 Momentum Dip
              <span className="ml-auto font-pixel text-[7px] opacity-60">+50 XP</span>
            </Button>
            <Button
              onClick={() => onTrigger("double_trouble")}
              variant="outline"
              size="sm"
              className="justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 text-sm"
            >
              🔥 Double Trouble
              <span className="ml-auto font-pixel text-[7px] opacity-60">+100 XP</span>
            </Button>
          </div>
        </div>

        {/* Connection */}
        <div className="border-2 border-border bg-muted/30 p-3">
          <p className="font-pixel text-[7px] text-muted-foreground">CONNECTION</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className={`h-2 w-2 ${connected ? "bg-primary" : demoMode ? "bg-accent" : "bg-destructive"}`} />
            <span className="text-sm text-foreground">
              {connected ? "Backend online" : demoMode ? "Demo mode (local)" : "Disconnected"}
            </span>
          </div>
          {!connected && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Set <span className="text-accent">VITE_API_URL</span> to connect
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

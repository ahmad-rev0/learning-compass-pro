import { useSimulation } from "@/hooks/useSimulation";
import { StateIndicator } from "@/components/StateIndicator";
import { StatsBar } from "@/components/StatsBar";
import { QuestsPanel } from "@/components/QuestsPanel";
import { EventLog } from "@/components/EventLog";
import { ControlsPanel } from "@/components/ControlsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { state, quests, stats, events, connected, error, start, stop, reset, trigger } = useSimulation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Momentum Compass</h1>
              <p className="text-xs text-muted-foreground">Agentic Gamification Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "destructive"} className="text-xs">
              {connected ? "● Connected" : "○ Disconnected"}
            </Badge>
            {stats?.motivation && (
              <span className="hidden text-xs text-muted-foreground md:block">{stats.motivation}</span>
            )}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && !connected && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-center">
          <p className="text-sm text-destructive">
            Backend not connected. Start the API server or set <code className="font-mono text-xs">VITE_API_URL</code>.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run: <code className="font-mono">cd momentum_compass_backend && uvicorn main:app --reload</code>
          </p>
        </div>
      )}

      {/* Dashboard */}
      <main className="container space-y-4 py-6">
        {/* State Indicator */}
        <StateIndicator
          state={state?.state || "normal"}
          topic={state?.metrics?.current_topic || "—"}
          studentName={state?.student_name || "Alex"}
          isRunning={state?.simulation_running || false}
        />

        {/* XP Stats */}
        <StatsBar stats={stats} />

        {/* Main grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <EventLog events={events} />
            <QuestsPanel active={quests?.active || []} completed={quests?.completed || []} />
          </div>
          <div className="space-y-4">
            <ControlsPanel
              isRunning={state?.simulation_running || false}
              connected={connected}
              onStart={start}
              onStop={stop}
              onReset={reset}
              onTrigger={trigger}
            />
            <MetricsPanel metrics={state?.metrics || null} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

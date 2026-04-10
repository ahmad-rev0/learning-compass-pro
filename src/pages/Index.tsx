import { useSimulation } from "@/hooks/useSimulation";
import { StateIndicator } from "@/components/StateIndicator";
import { StatsBar } from "@/components/StatsBar";
import { QuestsPanel } from "@/components/QuestsPanel";
import { EventLog } from "@/components/EventLog";
import { ControlsPanel } from "@/components/ControlsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { AgentDecisionLog } from "@/components/AgentDecisionLog";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { MomentumChart } from "@/components/MomentumChart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Index = () => {
  const {
    state, quests, stats, events, agentDecisions, achievements, stateHistory,
    connected, demoMode, start, stop, reset, trigger, isRunning,
  } = useSimulation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-2xl"
            >
              🧭
            </motion.span>
            <div>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">
                Momentum & Stuckness Compass
              </h1>
              <p className="text-[10px] text-muted-foreground md:text-xs">
                Autonomous Agent × Gamified Learning Recovery × Exa AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats?.motivation && (
              <motion.p
                key={stats.motivation}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden max-w-xs text-right text-xs text-muted-foreground lg:block"
              >
                {stats.motivation}
              </motion.p>
            )}
            <Badge variant={connected ? "default" : demoMode ? "outline" : "destructive"} className="text-[10px]">
              {connected ? "● API" : demoMode ? "◉ Demo" : "○ Off"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="container space-y-4 py-4">
        {/* State Indicator */}
        <StateIndicator
          state={state?.state || "normal"}
          topic={state?.metrics?.current_topic || "—"}
          studentName={state?.student_name || "Alex Chen"}
          isRunning={isRunning}
          demoMode={demoMode}
          tickCount={state?.metrics?.total_ticks || 0}
        />

        {/* XP Stats Row */}
        <StatsBar stats={stats} />

        {/* Main content area */}
        <div className="grid gap-4 xl:grid-cols-4">
          {/* Left: Agent + Quests (2 cols) */}
          <div className="space-y-4 xl:col-span-2">
            <Tabs defaultValue="agent" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="agent" className="flex-1 gap-1.5">
                  🤖 Agent Decisions
                </TabsTrigger>
                <TabsTrigger value="quests" className="flex-1 gap-1.5">
                  ⚔️ Quests
                </TabsTrigger>
              </TabsList>
              <TabsContent value="agent" className="mt-3">
                <AgentDecisionLog decisions={agentDecisions} />
              </TabsContent>
              <TabsContent value="quests" className="mt-3">
                <QuestsPanel active={quests?.active || []} completed={quests?.completed || []} />
              </TabsContent>
            </Tabs>

            {/* Event stream */}
            <EventLog events={events} />
          </div>

          {/* Right sidebar (2 cols) */}
          <div className="space-y-4 xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {/* Controls */}
              <ControlsPanel
                isRunning={isRunning}
                connected={connected}
                demoMode={demoMode}
                onStart={start}
                onStop={stop}
                onReset={reset}
                onTrigger={trigger}
              />
              {/* Metrics */}
              <MetricsPanel metrics={state?.metrics || null} />
            </div>

            {/* State Timeline */}
            <MomentumChart stateHistory={stateHistory} />

            {/* Achievements */}
            <AchievementsPanel achievements={achievements} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 py-4">
        <div className="container flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>🧭 Momentum Compass</span>
            <span>•</span>
            <span>Hackathon Project</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by: <span className="text-primary">Exa AI</span></span>
            <span>•</span>
            <span>State Machine: <span className="text-accent">4-state detection</span></span>
            <span>•</span>
            <span>Gamification: <span className="text-warning">XP + Streaks + Quests</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState } from "react";
import atlasLogo from "@/assets/atlas-logo.png";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplashScreen } from "@/components/SplashScreen";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {
    state, quests, stats, events, agentDecisions, achievements, stateHistory,
    connected, demoMode, start, stop, reset, trigger, isRunning,
  } = useSimulation();

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="min-h-screen bg-background pixel-grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-3 border-border bg-card/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <img src={atlasLogo} alt="Atlas" width={28} height={28} />
            </motion.span>
            <div>
              <h1 className="font-pixel text-[10px] md:text-xs tracking-wide text-foreground">
                ATLAS
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Agent × Gamification × Exa AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats?.motivation && (
              <motion.p
                key={stats.motivation}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden max-w-xs text-right text-sm text-muted-foreground lg:block"
              >
                {stats.motivation}
              </motion.p>
            )}
            <ThemeToggle />
            <Badge
              variant={connected ? "default" : demoMode ? "outline" : "destructive"}
              className="font-pixel text-[7px]"
            >
              {connected ? "► API" : demoMode ? "◉ DEMO" : "○ OFF"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="container space-y-4 py-4">
        <StateIndicator
          state={state?.state || "normal"}
          topic={state?.metrics?.current_topic || "—"}
          studentName={state?.student_name || "Alex Chen"}
          isRunning={isRunning}
          demoMode={demoMode}
          tickCount={state?.metrics?.total_ticks || 0}
        />

        <StatsBar stats={stats} />

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="space-y-4 xl:col-span-2">
            <Tabs defaultValue="agent" className="w-full">
              <TabsList className="w-full border-2 border-border bg-card">
                <TabsTrigger value="agent" className="flex-1 gap-1.5 font-pixel text-[8px]">
                  🤖 AGENT
                </TabsTrigger>
                <TabsTrigger value="quests" className="flex-1 gap-1.5 font-pixel text-[8px]">
                  ⚔ QUESTS
                </TabsTrigger>
              </TabsList>
              <TabsContent value="agent" className="mt-3">
                <AgentDecisionLog decisions={agentDecisions} />
              </TabsContent>
              <TabsContent value="quests" className="mt-3">
                <QuestsPanel active={quests?.active || []} completed={quests?.completed || []} />
              </TabsContent>
            </Tabs>

            <EventLog events={events} />
          </div>

          <div className="space-y-4 xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <ControlsPanel
                isRunning={isRunning}
                connected={connected}
                demoMode={demoMode}
                onStart={start}
                onStop={stop}
                onReset={reset}
                onTrigger={trigger}
              />
              <MetricsPanel metrics={state?.metrics || null} />
            </div>

            <MomentumChart stateHistory={stateHistory} />
            <AchievementsPanel achievements={achievements} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-border bg-card/50 py-4 mt-8">
        <div className="container flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span><img src={atlasLogo} alt="Atlas" width={16} height={16} className="inline mr-1" />Atlas</span>
            <span className="text-border">|</span>
            <span>Hackathon Project</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by: <span className="text-primary">Exa AI</span></span>
            <span className="text-border">|</span>
            <span>Detection: <span className="text-accent">4-state machine</span></span>
            <span className="text-border">|</span>
            <span>Rewards: <span className="text-warning">XP + Quests + Badges</span></span>
          </div>
        </div>
      </footer>
    </motion.div>
    </>
  );
};

export default Index;

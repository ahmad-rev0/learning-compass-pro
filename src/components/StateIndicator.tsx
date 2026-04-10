import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PixelCharacter, PixelSparkles } from "./PixelCharacter";

const STATE_CONFIG: Record<string, { label: string; color: string; glowClass: string; desc: string }> = {
  normal: { label: "ALL GOOD", color: "text-primary", glowClass: "pixel-card-glow-green", desc: "Student is cruising along nicely ♪" },
  micro_stuck: { label: "MICRO-STUCK", color: "text-warning", glowClass: "pixel-card-glow-gold", desc: "Uh oh! Hitting the same bugs over and over..." },
  momentum_dip: { label: "MOMENTUM DIP", color: "text-accent", glowClass: "pixel-card-glow-purple", desc: "Energy is dropping... need a recharge!" },
  double_trouble: { label: "DOUBLE TROUBLE", color: "text-destructive", glowClass: "pixel-card-glow-red", desc: "CRITICAL! Both errors AND momentum down!" },
};

interface StateIndicatorProps {
  state: string;
  topic: string;
  studentName: string;
  isRunning: boolean;
  demoMode: boolean;
  tickCount: number;
}

export function StateIndicator({ state, topic, studentName, isRunning, demoMode, tickCount }: StateIndicatorProps) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.normal;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden bg-card p-5 pixel-card pixel-grid-bg scanlines",
          config.glowClass
        )}
      >
        <PixelSparkles active={state === "normal"} />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <PixelCharacter state={state} size="lg" />
            <div>
              <h2 className={cn("font-pixel text-sm md:text-base tracking-wide", config.color)}>
                {config.label}
              </h2>
              <p className="mt-2 text-base text-muted-foreground">{config.desc}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span>👤 {studentName}</span>
                <span className="text-border">|</span>
                <span>📚 <span className="text-foreground">{topic}</span></span>
                <span className="text-border">|</span>
                <span>⏱ Tick #{tickCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={isRunning ? "default" : "secondary"}
              className={cn(
                "font-pixel text-[8px] px-3 py-1",
                isRunning && "animate-pixel-blink"
              )}
            >
              {isRunning ? "► LIVE" : "❚❚ PAUSED"}
            </Badge>
            {demoMode && (
              <Badge variant="outline" className="font-pixel text-[7px] border-accent/40 text-accent">
                DEMO MODE
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STATE_CONFIG: Record<string, { label: string; color: string; bgGlow: string; icon: string; desc: string }> = {
  normal: { label: "Normal", color: "text-success", bgGlow: "shadow-[0_0_30px_hsl(160,84%,45%,0.15)]", icon: "✅", desc: "Student is learning smoothly" },
  micro_stuck: { label: "Micro-Stuck", color: "text-warning", bgGlow: "shadow-[0_0_30px_hsl(38,92%,50%,0.2)]", icon: "⚠️", desc: "Repeated errors detected — agent intervening" },
  momentum_dip: { label: "Momentum Dip", color: "text-accent", bgGlow: "shadow-[0_0_30px_hsl(270,65%,55%,0.2)]", icon: "📉", desc: "Quiz scores or study time declining" },
  double_trouble: { label: "Double Trouble", color: "text-destructive", bgGlow: "shadow-[0_0_30px_hsl(0,72%,55%,0.25)]", icon: "🔥", desc: "Both errors AND momentum are critical" },
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-shadow duration-500",
          config.bgGlow
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-3xl"
            >
              {config.icon}
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={cn("text-2xl font-bold tracking-tight", config.color)}>{config.label}</h2>
                {state !== "normal" && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Badge variant="destructive" className="text-[10px]">AGENT ACTIVE</Badge>
                  </motion.div>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{config.desc}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>👤 {studentName}</span>
                <span className="text-border">│</span>
                <span>📚 <span className="font-mono text-foreground">{topic}</span></span>
                <span className="text-border">│</span>
                <span>⏱ Tick #{tickCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={isRunning ? "default" : "secondary"} className={cn("text-xs", isRunning && "pulse-glow")}>
              {isRunning ? "● LIVE" : "○ PAUSED"}
            </Badge>
            {demoMode && (
              <Badge variant="outline" className="border-accent/30 text-[10px] text-accent">
                DEMO MODE
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/lib/retroSfx";

const BOOT_LINES = [
  { text: "MOMENTUM COMPASS v1.0", delay: 0 },
  { text: "© 2025 HACKATHON STUDIOS", delay: 400 },
  { text: "", delay: 700 },
  { text: "CHECKING MEMORY......OK", delay: 900 },
  { text: "LOADING AGENT CORE....OK", delay: 1400 },
  { text: "INIT EXA AI MODULE....OK", delay: 1900 },
  { text: "QUEST ENGINE..........OK", delay: 2400 },
  { text: "XP SYSTEM.............OK", delay: 2800 },
  { text: "", delay: 3000 },
  { text: "ALL SYSTEMS READY!", delay: 3200 },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showPress, setShowPress] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    timers.push(
      setTimeout(() => setShowPress(true), 3800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleSkip = () => {
    if (exiting) return;
    sfx.click();
    setExiting(true);
    setTimeout(onComplete, 600);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background cursor-pointer"
          onClick={handleSkip}
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 0% 0% / 0.15) 2px, hsl(0 0% 0% / 0.15) 4px)",
              }}
            />
          </div>

          {/* CRT vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background)) 100%)",
            }}
          />

          <div className="relative z-10 max-w-md w-full px-8">
            {/* Console frame */}
            <div className="border-2 border-border p-6 bg-card/80 pixel-card">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="text-center mb-6"
              >
                <span className="text-4xl block mb-3">🧭</span>
              </motion.div>

              {/* Boot text */}
              <div className="font-pixel text-[8px] leading-[2] space-y-0 min-h-[180px]">
                {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className={
                      line.text === "ALL SYSTEMS READY!"
                        ? "text-primary mt-1"
                        : line.text.endsWith("OK")
                          ? "text-success"
                          : "text-muted-foreground"
                    }
                  >
                    {line.text || "\u00A0"}
                  </motion.div>
                ))}
                {/* Blinking cursor */}
                {visibleLines < BOOT_LINES.length && (
                  <span className="inline-block w-2 h-3 bg-primary animate-pixel-blink" />
                )}
              </div>

              {/* Press to start */}
              <AnimatePresence>
                {showPress && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-center mt-4 font-pixel text-[10px] text-foreground"
                  >
                    ▶ CLICK ANYWHERE TO START ◀
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Power LED */}
            <div className="flex items-center gap-2 mt-3 justify-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-primary"
              />
              <span className="font-pixel text-[6px] text-muted-foreground">PWR</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <motion.div
            animate={{ scale: [1, 0.95, 1.5], opacity: [1, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="text-5xl"
          >
            🧭
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

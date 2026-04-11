import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance, GuidanceStep } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, ChevronLeft, X, Compass } from "lucide-react";

export function WizardGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { steps, mood } = useWizardGuidance();

  const currentStep = steps[stepIndex] ?? steps[0];
  if (!currentStep) return null;

  const handleAction = () => {
    sfx.click();
    navigate(currentStep.route);
    setIsMinimized(true);
  };

  const nextStep = () => {
    sfx.navigate();
    setStepIndex((i) => (i + 1) % steps.length);
  };

  const prevStep = () => {
    sfx.navigate();
    setStepIndex((i) => (i - 1 + steps.length) % steps.length);
  };

  const toggleMinimize = () => {
    sfx.click();
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => { setIsOpen(true); setIsMinimized(false); sfx.click(); }}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-card border-2 border-primary/40 shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        title="Open Wizard Guide"
      >
        <Compass className="h-6 w-6 text-primary" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      className="fixed bottom-4 right-4 z-50"
      style={{ width: isMinimized ? "auto" : "340px" }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={toggleMinimize}
            className="relative w-20 h-20 rounded-full bg-card border-2 border-primary/40 shadow-lg shadow-primary/20 cursor-pointer hover:border-primary/60 transition-colors overflow-hidden"
            title="Expand wizard guide"
          >
            <Suspense fallback={null}>
              <WizardAvatar3DCanvas mood={mood} />
            </Suspense>
            {/* Notification dot */}
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary border-2 border-card animate-pulse" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border-2 border-border rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-card/95">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <span className="font-pixel text-[9px] text-foreground">ATLAS GUIDE</span>
                <span className="font-pixel text-[7px] text-muted-foreground">
                  {stepIndex + 1}/{steps.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMinimize}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
                  title="Minimize"
                >
                  —
                </button>
                <button
                  onClick={() => { setIsOpen(false); sfx.click(); }}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Wizard 3D Avatar */}
            <div className="relative h-36 bg-gradient-to-b from-[#0a1628] to-[#1a2a4a]">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <span className="font-pixel text-[8px] text-muted-foreground animate-pulse">Loading wizard...</span>
                </div>
              }>
                <WizardAvatar3DCanvas mood={mood} />
              </Suspense>

              {/* Mood indicator */}
              <div className="absolute bottom-2 left-2">
                <span className={`inline-block font-pixel text-[7px] px-2 py-0.5 rounded-full border ${
                  mood === "celebrating" ? "bg-[#44ff88]/15 text-[#44ff88] border-[#44ff88]/30"
                  : mood === "concerned" ? "bg-[#ff6644]/15 text-[#ff6644] border-[#ff6644]/30"
                  : mood === "pointing" ? "bg-[#bb88ff]/15 text-[#bb88ff] border-[#bb88ff]/30"
                  : mood === "thinking" ? "bg-[#f39c12]/15 text-[#f39c12] border-[#f39c12]/30"
                  : "bg-primary/15 text-primary border-primary/30"
                }`}>
                  {mood === "celebrating" ? "✨ Great job!"
                    : mood === "concerned" ? "⚠ Needs attention"
                    : mood === "pointing" ? "👉 Next step"
                    : mood === "thinking" ? "🤔 Thinking..."
                    : "🧭 Exploring"}
                </span>
              </div>
            </div>

            {/* Speech bubble */}
            <div className="px-3 py-3">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-pixel text-[7px] px-2 py-0.5 rounded border ${
                  currentStep.category === "quest" ? "bg-[#bb88ff]/10 text-[#bb88ff] border-[#bb88ff]/20"
                  : currentStep.category === "assignment" ? "bg-[#ff6644]/10 text-[#ff6644] border-[#ff6644]/20"
                  : currentStep.category === "momentum" ? "bg-[#f39c12]/10 text-[#f39c12] border-[#f39c12]/20"
                  : currentStep.category === "achievement" ? "bg-[#44ff88]/10 text-[#44ff88] border-[#44ff88]/20"
                  : "bg-primary/10 text-primary border-primary/20"
                }`}>
                  {currentStep.category}
                </span>
                <span className="font-pixel text-[7px] text-muted-foreground">
                  Priority: {"●".repeat(Math.min(3, Math.ceil(4 - currentStep.priority / 3)))}{"○".repeat(3 - Math.min(3, Math.ceil(4 - currentStep.priority / 3)))}
                </span>
              </div>

              {/* Message */}
              <p className="text-xs text-foreground leading-relaxed mb-3">
                {currentStep.message}
              </p>

              {/* Action button */}
              <button
                onClick={handleAction}
                className="w-full font-pixel text-[9px] py-2 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="h-3 w-3" />
                {currentStep.action}
                <ChevronRight className="h-3 w-3" />
              </button>

              {/* Step navigation */}
              {steps.length > 1 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={prevStep}
                    className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </button>
                  <div className="flex gap-1">
                    {steps.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === stepIndex ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextStep}
                    className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

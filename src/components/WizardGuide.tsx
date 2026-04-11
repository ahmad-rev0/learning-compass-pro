import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

/**
 * Wizard always hovers above/below the nav tab for the highest-priority route.
 * It dynamically re-targets when the priority changes (e.g., assignment due soon).
 */
export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number } | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  const WIZARD_W = 80;
  const WIZARD_H = 120;

  const isOnTargetRoute = currentStep && location.pathname === currentStep.route;

  // Position wizard next to the target nav tab
  const placeAtNav = useCallback(() => {
    if (!currentStep) return;
    const navTab = document.querySelector<HTMLElement>(`a[href="${currentStep.route}"]`);
    if (!navTab) return;

    const rect = navTab.getBoundingClientRect();
    setHighlightRect(rect);

    // Place wizard below the nav tab
    const wx = rect.left + rect.width / 2 - WIZARD_W / 2;
    const wy = rect.bottom + 8;

    setWizardPos({
      x: Math.max(10, Math.min(window.innerWidth - WIZARD_W - 10, wx)),
      y: Math.max(100, Math.min(window.innerHeight - WIZARD_H - 40, wy)),
    });
    setReady(true);
  }, [currentStep]);

  // Re-place on step change or route change
  useEffect(() => {
    if (!currentStep || dismissed) { setReady(false); return; }

    const timeout = setTimeout(placeAtNav, 300);
    return () => clearTimeout(timeout);
  }, [currentStep?.id, location.pathname, dismissed, placeAtNav]);

  // Update highlight on scroll/resize
  useEffect(() => {
    if (!ready || dismissed || !currentStep) return;

    const update = () => {
      const navTab = document.querySelector<HTMLElement>(`a[href="${currentStep.route}"]`);
      if (navTab) setHighlightRect(navTab.getBoundingClientRect());
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [ready, dismissed, currentStep]);

  if (!currentStep || dismissed || !ready || !wizardPos) return null;

  const handleAction = () => {
    sfx.click();
    navigate(currentStep.route);
  };

  // Pick speech text
  const bubbleText = isOnTargetRoute
    ? (mood === "concerned" ? "Do this first!" : "Complete this quest!")
    : (mood === "concerned" ? "This needs attention!" : "Go here next!");

  return (
    <>
      {/* Highlight glow on target nav tab */}
      {highlightRect && (
        <div
          className="fixed z-40 pointer-events-none rounded-md"
          style={{
            left: highlightRect.left - 3,
            top: highlightRect.top - 3,
            width: highlightRect.width + 6,
            height: highlightRect.height + 6,
            boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5), 0 0 14px 2px hsl(var(--primary) / 0.2)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Wizard — always fixed at nav level */}
      <motion.div
        className="fixed z-50 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        style={{
          width: WIZARD_W,
          height: WIZARD_H,
          left: wizardPos.x,
          top: wizardPos.y,
        }}
      >
        <button
          onClick={() => { setDismissed(true); sfx.click(); }}
          className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        <div className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={mood} />
        </div>

        {/* Speech bubble */}
        <div
          className="absolute pointer-events-auto"
          style={{ left: WIZARD_W + 4, top: 8, minWidth: 100 }}
        >
          {/* Bubble tail */}
          <div
            className="absolute -left-[6px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-border"
          />
          <div
            className="absolute -left-[4px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-card"
          />
          {/* Bubble body */}
          <div className="bg-card border border-border rounded px-2 py-1.5 shadow-lg">
            <p className="font-pixel text-[7px] text-foreground whitespace-nowrap leading-relaxed">
              {bubbleText}
            </p>
            {!isOnTargetRoute && (
              <button
                onClick={handleAction}
                className="font-pixel text-[7px] text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-0.5 mt-1"
              >
                {currentStep.action}
                <ChevronRight className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

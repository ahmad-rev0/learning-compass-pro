import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

/**
 * Maps guidance routes to CSS selectors for elements on the current page
 * the wizard should point toward.
 */
const ROUTE_TARGET_SELECTORS: Record<string, string> = {
  "/student/quests": "[data-wizard-target='quests']",
  "/student/assignments": "[data-wizard-target='assignments']",
  "/student/upload": "[data-wizard-target='upload']",
  "/student/progress": "[data-wizard-target='progress']",
  "/student/achievements": "[data-wizard-target='achievements']",
  "/student/study-plan": "[data-wizard-target='study-plan']",
  "/student/agent": "[data-wizard-target='agent']",
};

/** Find the nav tab for a route as a fallback target */
function findNavTarget(route: string): HTMLElement | null {
  return document.querySelector(`a[href="${route}"]`);
}

export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wizardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  // Find and track the target element position
  useEffect(() => {
    if (!currentStep || dismissed) return;

    const findTarget = () => {
      // First try page-level target
      const selector = ROUTE_TARGET_SELECTORS[currentStep.route];
      let el = selector ? document.querySelector<HTMLElement>(selector) : null;

      // If we're on a different page, point to the nav tab
      if (!el && location.pathname !== currentStep.route) {
        el = findNavTarget(currentStep.route);
      }

      // Fallback: first active quest card or first content card
      if (!el) {
        el = document.querySelector<HTMLElement>("[data-wizard-target]") ||
             document.querySelector<HTMLElement>(".space-y-2 > div:first-child");
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Position wizard to the left of the target, vertically centered
        const wizW = 100;
        const wizH = 150;
        let wx = rect.left - wizW - 20;
        let wy = rect.top + rect.height / 2 - wizH / 2;

        // If no room on left, go above
        if (wx < 10) {
          wx = rect.left + rect.width / 2 - wizW / 2;
          wy = rect.top - wizH - 20;
        }

        // Clamp to viewport
        wx = Math.max(10, Math.min(window.innerWidth - wizW - 10, wx));
        wy = Math.max(10, Math.min(window.innerHeight - wizH - 60, wy));

        setWizardPos({ x: wx, y: wy });
      } else {
        setTargetRect(null);
        // Default: center bottom
        setWizardPos({
          x: window.innerWidth / 2 - 50,
          y: window.innerHeight - 200,
        });
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 1500);
    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget, true);
    };
  }, [currentStep, dismissed, location.pathname]);

  if (!currentStep || dismissed) return null;

  const handleAction = () => {
    sfx.click();
    navigate(currentStep.route);
  };

  // Calculate arrow angle from wizard center to target center
  let arrowAngle = 0;
  if (targetRect && wizardRef.current) {
    const wizCx = wizardPos.x + 50;
    const wizCy = wizardPos.y + 75;
    const targetCx = targetRect.left + targetRect.width / 2;
    const targetCy = targetRect.top + targetRect.height / 2;
    arrowAngle = Math.atan2(targetCy - wizCy, targetCx - wizCx) * (180 / Math.PI);
  }

  return (
    <>
      {/* Highlight ring around the target element */}
      {targetRect && (
        <motion.div
          className="fixed z-40 pointer-events-none rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 3px hsl(var(--primary) / 0.5), 0 0 20px 4px hsl(var(--primary) / 0.2)",
          }}
        />
      )}

      {/* The wizard — no container, just floating */}
      <motion.div
        ref={wizardRef}
        className="fixed z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: wizardPos.x,
          y: wizardPos.y,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{ width: 100, height: 150 }}
      >
        {/* Dismiss button */}
        <button
          onClick={() => { setDismissed(true); sfx.click(); }}
          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Pixel wizard character */}
        <div className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={mood} />
        </div>

        {/* Pointing arrow from wizard toward target */}
        {targetRect && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transformOrigin: "0 50%",
              transform: `rotate(${arrowAngle}deg)`,
            }}
            animate={{ scaleX: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <div className="flex items-center">
              <div className="w-10 h-0.5 bg-primary/60" />
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-primary/80" />
            </div>
          </motion.div>
        )}

        {/* Speech bubble — floating near wizard, no container background */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ bottom: -36 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleAction}
            className="font-pixel text-[8px] text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-primary/30 rounded px-2 py-1 shadow-lg"
          >
            {currentStep.action}
            <ChevronRight className="h-3 w-3" />
          </button>
        </motion.div>

        {/* Mood speech text — small floating text */}
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="font-pixel text-[7px] text-foreground/80 bg-card/80 rounded px-1.5 py-0.5 border border-border/50">
            {currentStep.message.length > 50
              ? currentStep.message.slice(0, 50) + "…"
              : currentStep.message}
          </span>
        </motion.div>
      </motion.div>
    </>
  );
}

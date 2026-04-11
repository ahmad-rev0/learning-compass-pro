import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

/**
 * For each route the wizard might point to, try to find a specific
 * actionable element on the current page first, then fall back to the nav tab.
 */
function findTargetElement(route: string, currentPath: string): HTMLElement | null {
  // If we're on the target page, find the first actionable item
  if (currentPath === route || currentPath.startsWith(route)) {
    // Try first active quest card, first assignment card, etc.
    const firstCard =
      document.querySelector<HTMLElement>("[data-wizard-target] .space-y-2 > div:first-child") ||
      document.querySelector<HTMLElement>("[data-wizard-target] .space-y-2 > :first-child") ||
      document.querySelector<HTMLElement>("[data-wizard-target] > .space-y-2 > :first-child");

    if (firstCard) return firstCard;
  }

  // Fall back to the nav tab for that route
  return document.querySelector<HTMLElement>(`a[href="${route}"]`);
}

export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  const WIZARD_W = 80;
  const WIZARD_H = 120;

  useEffect(() => {
    if (!currentStep || dismissed) { setReady(false); return; }

    const findTarget = () => {
      const el = findTargetElement(currentStep.route, location.pathname);

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Position wizard to the left of the target element
        let wx = rect.left - WIZARD_W - 16;
        let wy = rect.top + rect.height / 2 - WIZARD_H / 2;

        // If no room on the left, try right side
        if (wx < 10) {
          wx = rect.right + 16;
        }

        // If still no room (very wide element), go above
        if (wx + WIZARD_W > window.innerWidth - 10) {
          wx = rect.left + rect.width / 2 - WIZARD_W / 2;
          wy = rect.top - WIZARD_H - 16;
        }

        // Clamp to viewport
        wx = Math.max(10, Math.min(window.innerWidth - WIZARD_W - 10, wx));
        wy = Math.max(80, Math.min(window.innerHeight - WIZARD_H - 50, wy));

        setWizardPos({ x: wx, y: wy });
        setReady(true);
      } else {
        setTargetRect(null);
        // Default: center-bottom
        setWizardPos({
          x: window.innerWidth / 2 - WIZARD_W / 2,
          y: window.innerHeight - WIZARD_H - 80,
        });
        setReady(true);
      }
    };

    // Delay initial find to let page render
    const initialTimeout = setTimeout(findTarget, 300);
    const interval = setInterval(findTarget, 2000);
    window.addEventListener("scroll", findTarget, true);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener("scroll", findTarget, true);
    };
  }, [currentStep, dismissed, location.pathname]);

  if (!currentStep || dismissed || !ready) return null;

  const handleAction = () => {
    sfx.click();
    navigate(currentStep.route);
  };

  // Arrow angle from wizard center to target center
  let arrowAngle = 0;
  let arrowLen = 40;
  if (targetRect) {
    const wizCx = wizardPos.x + WIZARD_W / 2;
    const wizCy = wizardPos.y + WIZARD_H / 2;
    const targetCx = targetRect.left + targetRect.width / 2;
    const targetCy = targetRect.top + targetRect.height / 2;
    arrowAngle = Math.atan2(targetCy - wizCy, targetCx - wizCx) * (180 / Math.PI);
    const dist = Math.sqrt((targetCx - wizCx) ** 2 + (targetCy - wizCy) ** 2);
    arrowLen = Math.min(60, Math.max(20, dist * 0.3));
  }

  return (
    <>
      {/* Highlight glow on target */}
      {targetRect && (
        <motion.div
          className="fixed z-40 pointer-events-none rounded-md"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            left: targetRect.left - 3,
            top: targetRect.top - 3,
            width: targetRect.width + 6,
            height: targetRect.height + 6,
            boxShadow: "0 0 0 2px hsl(var(--primary) / 0.6), 0 0 16px 2px hsl(var(--primary) / 0.25)",
          }}
        />
      )}

      {/* Free-floating wizard */}
      <motion.div
        ref={wizardRef}
        className="fixed z-50 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: wizardPos.x,
          y: wizardPos.y,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        style={{ width: WIZARD_W, height: WIZARD_H }}
      >
        {/* Dismiss X */}
        <button
          onClick={() => { setDismissed(true); sfx.click(); }}
          className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        {/* The pixel wizard — no container */}
        <div className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={mood} />
        </div>

        {/* Pointing arrow */}
        {targetRect && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transformOrigin: "0 50%",
              transform: `rotate(${arrowAngle}deg)`,
            }}
          >
            <motion.div
              className="flex items-center"
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            >
              <div
                className="h-[2px] bg-primary/70"
                style={{ width: arrowLen }}
              />
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-primary/90" />
            </motion.div>
          </div>
        )}

        {/* Speech text above wizard */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: -24 }}
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <span className="font-pixel text-[7px] text-primary whitespace-nowrap">
            {mood === "concerned" ? "⚠ Needs attention!" 
              : mood === "celebrating" ? "✨ Great job!"
              : mood === "thinking" ? "🤔 Hmm..."
              : "👉 Do this next!"}
          </span>
        </motion.div>

        {/* Action label below wizard */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ bottom: -20 }}
        >
          <button
            onClick={handleAction}
            className="font-pixel text-[7px] text-primary/80 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5"
          >
            {currentStep.action}
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}

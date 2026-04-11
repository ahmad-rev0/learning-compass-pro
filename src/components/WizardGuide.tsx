import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

/**
 * Smart target finding:
 * - If we're on the target page, find the first quest card or content element
 * - Otherwise point to the nav tab
 */
function findTargetElement(route: string, currentPath: string): HTMLElement | null {
  if (currentPath === route) {
    // On the target page — find the first actionable quest card
    const firstQuest = document.querySelector<HTMLElement>("[data-wizard-quest='first']");
    if (firstQuest) return firstQuest;

    // Fallback: first card on the page
    const firstCard = document.querySelector<HTMLElement>("[data-wizard-target] .border-2");
    if (firstCard) return firstCard;
  }

  // Not on target page — point to the nav tab
  const navTab = document.querySelector<HTMLElement>(`a[href="${route}"]`);
  if (navTab) return navTab;
  return null;
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

        // Position wizard to the LEFT of the target, offset enough to not overlap content
        let wx = rect.left - WIZARD_W - 12;
        let wy = rect.top + rect.height / 2 - WIZARD_H / 2;

        // If no room on left, try right
        if (wx < 10) {
          wx = rect.right + 12;
        }

        // If still no room, go above
        if (wx + WIZARD_W > window.innerWidth - 10) {
          wx = rect.left + rect.width / 2 - WIZARD_W / 2;
          wy = rect.top - WIZARD_H - 12;
        }

        // Clamp — keep below header (top ~140px) and above bottom
        wx = Math.max(10, Math.min(window.innerWidth - WIZARD_W - 10, wx));
        wy = Math.max(140, Math.min(window.innerHeight - WIZARD_H - 40, wy));

        setWizardPos({ x: wx, y: wy });
        setReady(true);
      } else {
        setTargetRect(null);
        // Default: left side, vertically centered below header
        setWizardPos({
          x: 20,
          y: window.innerHeight / 2 - WIZARD_H / 2,
        });
        setReady(true);
      }
    };

    const initialTimeout = setTimeout(findTarget, 400);
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
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  };

  // Whether we're already on the target page
  const onTargetPage = location.pathname === currentStep.route;

  return (
    <>
      {/* Highlight glow on target */}
      {targetRect && (
        <motion.div
          className="fixed z-40 pointer-events-none rounded-md"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            left: targetRect.left - 3,
            top: targetRect.top - 3,
            width: targetRect.width + 6,
            height: targetRect.height + 6,
            boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5), 0 0 14px 2px hsl(var(--primary) / 0.2)",
          }}
        />
      )}

      {/* Free-floating wizard — uses "pointing" mood when staff should aim at target */}
      <motion.div
        ref={wizardRef}
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
        {/* Dismiss X */}
        <button
          onClick={() => { setDismissed(true); sfx.click(); }}
          className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        {/* The pixel wizard — staff points at target via "pointing" mood */}
        <div className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={targetRect ? "pointing" : mood} />
        </div>

        {/* Speech text above wizard */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: -20 }}
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

        {/* Action label below wizard — only show nav action if not already on page */}
        {!onTargetPage && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{ bottom: -16 }}
          >
            <button
              onClick={handleAction}
              className="font-pixel text-[7px] text-primary/80 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5"
            >
              {currentStep.action}
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

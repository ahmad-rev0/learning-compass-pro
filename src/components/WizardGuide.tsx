import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

type Phase = "nav" | "task";

export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number } | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [phase, setPhase] = useState<Phase>("nav");
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  const WIZARD_W = 80;
  const WIZARD_H = 120;
  const isOnTargetRoute = currentStep?.route === location.pathname;

  // Switch to task phase when we land on the target route
  useEffect(() => {
    if (isOnTargetRoute) {
      // Small delay so the page renders its cards first
      const t = setTimeout(() => setPhase("task"), 400);
      return () => clearTimeout(t);
    } else {
      setPhase("nav");
    }
  }, [isOnTargetRoute, currentStep?.id]);

  useEffect(() => {
    if (!currentStep || dismissed) {
      setWizardPos(null);
      setHighlightRect(null);
      return;
    }

    let frame = 0;

    const sync = () => {
      let targetEl: HTMLElement | null = null;

      if (phase === "task" && isOnTargetRoute) {
        // Try to find the highest-priority card on the page
        const cardSelector =
          currentStep.category === "quest"
            ? '[data-wizard-quest="first"]'
            : currentStep.category === "assignment"
              ? '[data-wizard-assignment="first"]'
              : null;
        if (cardSelector) {
          targetEl = document.querySelector<HTMLElement>(cardSelector);
        }
      }

      // Fall back to nav tab
      if (!targetEl) {
        targetEl = document.querySelector<HTMLElement>(`[data-nav-route="${currentStep.route}"]`);
      }

      if (!targetEl) {
        frame = window.requestAnimationFrame(sync);
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const visible =
        rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0 && rect.height > 0;

      if (!visible) {
        // If task card is off-screen, scroll to it
        if (phase === "task") {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setHighlightRect(null);
        setWizardPos(null);
        frame = window.requestAnimationFrame(sync);
        return;
      }

      setHighlightRect(rect);

      if (phase === "task") {
        // Position wizard to the left of the card, using absolute-like behavior
        const desiredX = rect.left - WIZARD_W - 8;
        const desiredY = rect.top + rect.height / 2 - WIZARD_H / 2;
        setWizardPos({
          x: Math.max(8, desiredX < 8 ? rect.right + 8 : desiredX),
          y: Math.max(8, Math.min(window.innerHeight - WIZARD_H - 8, desiredY)),
        });
      } else {
        // Nav phase: position above the tab
        const desiredX = rect.left + rect.width / 2 - WIZARD_W / 2;
        const desiredY = Math.max(8, rect.top - WIZARD_H - 10);
        setWizardPos({
          x: Math.max(8, Math.min(window.innerWidth - WIZARD_W - 8, desiredX)),
          y: desiredY,
        });
      }

      frame = window.requestAnimationFrame(sync);
    };

    frame = window.requestAnimationFrame(sync);
    return () => window.cancelAnimationFrame(frame);
  }, [currentStep?.id, currentStep?.route, currentStep?.category, dismissed, phase, isOnTargetRoute]);

  if (!currentStep || dismissed || !wizardPos || !highlightRect) return null;

  const handleAction = () => {
    sfx.click();
    navigate(currentStep.route);
  };

  const bubbleText =
    phase === "task"
      ? mood === "concerned"
        ? "Work on this first!"
        : "Here's your top priority!"
      : isOnTargetRoute
        ? mood === "concerned"
          ? "Do this first!"
          : "You're in the right place!"
        : mood === "concerned"
          ? "This needs attention!"
          : "Go here next!";

  return (
    <>
      <div
        className="fixed z-40 pointer-events-none rounded-md"
        style={{
          left: highlightRect.left - 2,
          top: highlightRect.top - 2,
          width: highlightRect.width + 4,
          height: highlightRect.height + 4,
          boxShadow:
            "0 0 0 2px hsl(var(--primary) / 0.55), 0 0 12px 1px hsl(var(--primary) / 0.18)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />

      <motion.div
        className="fixed z-50 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        style={{
          width: WIZARD_W,
          height: WIZARD_H,
          left: wizardPos.x,
          top: wizardPos.y,
        }}
      >
        <button
          onClick={() => {
            setDismissed(true);
            sfx.click();
          }}
          className="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-border/50 bg-card/80 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        <div className="h-full w-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={mood} />
        </div>

        <div
          className="absolute pointer-events-auto"
          style={{ left: WIZARD_W + 4, top: 8, minWidth: 110 }}
        >
          <div className="absolute -left-[6px] top-3 h-0 w-0 border-b-[5px] border-b-transparent border-r-[6px] border-r-border border-t-[5px] border-t-transparent" />
          <div className="absolute -left-[4px] top-3 h-0 w-0 border-b-[5px] border-b-transparent border-r-[5px] border-r-card border-t-[5px] border-t-transparent" />
          <div className="rounded border border-border bg-card px-2 py-1.5 shadow-lg">
            <p className="font-pixel text-[7px] leading-relaxed text-foreground whitespace-nowrap">
              {bubbleText}
            </p>
            {!isOnTargetRoute && phase === "nav" && (
              <button
                onClick={handleAction}
                className="mt-1 flex cursor-pointer items-center gap-0.5 font-pixel text-[7px] text-primary transition-colors hover:text-primary/80"
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

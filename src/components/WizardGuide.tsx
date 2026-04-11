import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

/**
 * Two-phase wizard:
 * Phase 1 ("nav"): Point at the nav tab for the priority route
 * Phase 2 ("task"): User navigated there → wizard moves inside the first quest card
 */
type WizardPhase = "nav" | "task";

export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<WizardPhase>("nav");
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number } | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const hasNavigatedRef = useRef(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  const WIZARD_W = 80;
  const WIZARD_H = 120;

  // Detect if user is already on the target route → go straight to phase 2
  useEffect(() => {
    if (!currentStep || dismissed) return;
    if (location.pathname === currentStep.route) {
      setPhase("task");
      hasNavigatedRef.current = true;
    } else {
      setPhase("nav");
      hasNavigatedRef.current = false;
    }
  }, [currentStep?.id, location.pathname, dismissed]);

  // Phase 1: position wizard next to the nav tab
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

  // Phase 2: position wizard INSIDE the first quest card (right side)
  const placeAtTask = useCallback(() => {
    // Find first quest card
    const card = document.querySelector<HTMLElement>("[data-wizard-quest='first']");
    if (!card) {
      // Fallback: first card on the page
      const fallback = document.querySelector<HTMLElement>("[data-wizard-target] .border-2");
      if (!fallback) { placeAtNav(); return; }
      positionInsideCard(fallback);
      return;
    }
    positionInsideCard(card);
  }, [placeAtNav]);

  const positionInsideCard = (card: HTMLElement) => {
    const rect = card.getBoundingClientRect();
    // Scroll the card into view first
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for scroll to settle, then place wizard inside the card on the right
    setTimeout(() => {
      const freshRect = card.getBoundingClientRect();
      setHighlightRect(freshRect);

      // Position wizard inside the card, on the right side
      const wx = freshRect.right - WIZARD_W - 8;
      const wy = freshRect.top + freshRect.height / 2 - WIZARD_H / 2;

      setWizardPos({
        x: Math.max(10, Math.min(window.innerWidth - WIZARD_W - 10, wx)),
        y: Math.max(100, Math.min(window.innerHeight - WIZARD_H - 40, wy)),
      });
      setReady(true);
    }, 500);
  };

  // Run placement based on phase
  useEffect(() => {
    if (!currentStep || dismissed) { setReady(false); return; }

    const timeout = setTimeout(() => {
      if (phase === "nav") {
        placeAtNav();
      } else {
        placeAtTask();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [phase, currentStep?.id, dismissed]);

  // Update highlight rect on scroll (wizard stays put)
  useEffect(() => {
    if (!ready || dismissed || phase !== "task") return;

    // For task phase, keep highlight tracking the card but DON'T move wizard
    const updateHighlight = () => {
      const card = document.querySelector<HTMLElement>("[data-wizard-quest='first']") ||
                   document.querySelector<HTMLElement>("[data-wizard-target] .border-2");
      if (card && document.contains(card)) {
        setHighlightRect(card.getBoundingClientRect());
      }
    };

    window.addEventListener("scroll", updateHighlight, true);
    return () => window.removeEventListener("scroll", updateHighlight, true);
  }, [ready, dismissed, phase]);

  if (!currentStep || dismissed || !ready || !wizardPos) return null;

  const handleAction = () => {
    sfx.click();
    if (phase === "nav") {
      navigate(currentStep.route);
      // Phase will switch to "task" via the location effect
    }
  };

  return (
    <>
      {/* Highlight glow on target */}
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

      {/* Wizard — FIXED, does not move on scroll */}
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
        <button
          onClick={() => { setDismissed(true); sfx.click(); }}
          className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        <div className="w-full h-full" style={{ imageRendering: "pixelated" }}>
          <WizardAvatar3DCanvas mood={phase === "task" ? "pointing" : mood} />
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
              {phase === "nav"
                ? (mood === "concerned" ? "This needs attention!" : "Go here next!")
                : (mood === "concerned" ? "Do this first!" : "Complete this quest!")}
            </p>
            {phase === "nav" && (
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

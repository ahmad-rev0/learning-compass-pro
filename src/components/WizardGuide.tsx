import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { WizardAvatar3DCanvas } from "@/components/WizardAvatar3D";
import { useWizardGuidance } from "@/hooks/useWizardGuidance";
import { sfx } from "@/lib/retroSfx";
import { ChevronRight, X } from "lucide-react";

function findTargetElement(route: string, currentPath: string): HTMLElement | null {
  if (currentPath === route) {
    const firstQuest = document.querySelector<HTMLElement>("[data-wizard-quest='first']");
    if (firstQuest) return firstQuest;
    const firstCard = document.querySelector<HTMLElement>("[data-wizard-target] .border-2");
    if (firstCard) return firstCard;
  }
  return document.querySelector<HTMLElement>(`a[href="${route}"]`);
}

export function WizardGuide() {
  const [dismissed, setDismissed] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [wizardPos, setWizardPos] = useState<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const targetElRef = useRef<HTMLElement | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { steps, mood } = useWizardGuidance();
  const currentStep = steps[0];

  const WIZARD_W = 80;
  const WIZARD_H = 120;

  // 1) Find target and set wizard position ONCE per route/step change (not on scroll)
  useEffect(() => {
    if (!currentStep || dismissed) { setReady(false); return; }

    const placeWizard = () => {
      const el = findTargetElement(currentStep.route, location.pathname);
      targetElRef.current = el;

      if (el) {
        const rect = el.getBoundingClientRect();

        // Position wizard to the LEFT of the target
        let wx = rect.left - WIZARD_W - 12;
        let wy = rect.top + rect.height / 2 - WIZARD_H / 2;

        if (wx < 10) wx = rect.right + 12;
        if (wx + WIZARD_W > window.innerWidth - 10) {
          wx = rect.left + rect.width / 2 - WIZARD_W / 2;
          wy = rect.top - WIZARD_H - 12;
        }

        wx = Math.max(10, Math.min(window.innerWidth - WIZARD_W - 10, wx));
        wy = Math.max(140, Math.min(window.innerHeight - WIZARD_H - 40, wy));

        setWizardPos({ x: wx, y: wy });
        setHighlightRect(rect);
        setReady(true);
      } else {
        setWizardPos({ x: 20, y: window.innerHeight / 2 - WIZARD_H / 2 });
        setHighlightRect(null);
        setReady(true);
      }
    };

    // Delay to let page render
    const timeout = setTimeout(placeWizard, 400);
    return () => clearTimeout(timeout);
  }, [currentStep?.id, dismissed, location.pathname]);

  // 2) Update only the HIGHLIGHT rect on scroll (wizard stays put)
  useEffect(() => {
    if (!ready || dismissed) return;

    const updateHighlight = () => {
      const el = targetElRef.current;
      if (el && document.contains(el)) {
        setHighlightRect(el.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    };

    window.addEventListener("scroll", updateHighlight, true);
    return () => window.removeEventListener("scroll", updateHighlight, true);
  }, [ready, dismissed]);

  if (!currentStep || dismissed || !ready || !wizardPos) return null;

  const handleAction = () => {
    sfx.click();
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    } else if (targetElRef.current) {
      targetElRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const onTargetPage = location.pathname === currentStep.route;

  return (
    <>
      {/* Highlight glow — tracks scroll */}
      {highlightRect && (
        <motion.div
          className="fixed z-40 pointer-events-none rounded-md"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            left: highlightRect.left - 3,
            top: highlightRect.top - 3,
            width: highlightRect.width + 6,
            height: highlightRect.height + 6,
            boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5), 0 0 14px 2px hsl(var(--primary) / 0.2)",
          }}
        />
      )}

      {/* Wizard — FIXED position, does NOT move on scroll */}
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
          <WizardAvatar3DCanvas mood={highlightRect ? "pointing" : mood} />
        </div>

        {/* Speech text */}
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

        {/* Action button */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ bottom: -16 }}
        >
          <button
            onClick={handleAction}
            className="font-pixel text-[7px] text-primary/80 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5"
          >
            {onTargetPage ? "Show me ↓" : currentStep.action}
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}

import { motion, AnimatePresence } from "framer-motion";

interface PixelCharacterProps {
  state: string;
  size?: "sm" | "md" | "lg";
}

const EXPRESSIONS: Record<string, { face: string; emote: string; color: string }> = {
  normal: { face: "(◕‿◕)", emote: "♪", color: "text-primary" },
  micro_stuck: { face: "(>_<)", emote: "?!", color: "text-warning" },
  momentum_dip: { face: "(╥_╥)", emote: "...", color: "text-accent" },
  double_trouble: { face: "(×_×)", emote: "!!!", color: "text-destructive" },
};

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function PixelCharacter({ state, size = "md" }: PixelCharacterProps) {
  const expr = EXPRESSIONS[state] || EXPRESSIONS.normal;

  const animationVariant = {
    normal: {
      y: [0, -3, 0, -1, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
    micro_stuck: {
      x: [-2, 2, -2, 2, 0],
      transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" },
    },
    momentum_dip: {
      y: [0, 2, 0],
      opacity: [1, 0.7, 1],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    },
    double_trouble: {
      rotate: [-5, 5, -5, 5, 0],
      scale: [1, 1.05, 1, 1.05, 1],
      transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
    },
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <motion.div
            animate={animationVariant[state] || animationVariant.normal}
            className={`font-pixel ${sizes[size]} ${expr.color} select-none`}
          >
            {/* Pixel hat */}
            <div className="text-center text-xs leading-none mb-[-2px]">
              {state === "normal" && "🎓"}
              {state === "micro_stuck" && "🔧"}
              {state === "momentum_dip" && "😴"}
              {state === "double_trouble" && "🆘"}
            </div>
            {/* Face */}
            <div className="text-center whitespace-nowrap">{expr.face}</div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Floating emote bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${state}-emote`}
          initial={{ opacity: 0, y: 5, scale: 0.5 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.5 }}
          className={`absolute -top-5 -right-4 font-pixel text-xs ${expr.color}`}
        >
          {expr.emote}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Floating +XP popup */
export function XPPopup({ amount, show }: { amount: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 1.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute font-pixel text-sm text-primary pointer-events-none"
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Sparkle effect for quest completion */
export function PixelSparkles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 60],
            y: [0, (Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          className="absolute text-warning"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

type WizardMood = "idle" | "pointing" | "celebrating" | "concerned" | "thinking";

/* ── 8-bit colour palette ── */
const PAL = {
  robe:       "#2a3a6b",
  robeLight:  "#3a4a8b",
  robeDark:   "#1a2a4b",
  skin:       "#e8a87c",
  skinShade:  "#c4845a",
  hat:        "#1a2a5b",
  hatBand:    "#c4a97d",
  staffWood:  "#8b6914",
  staffGem:   "#44ffaa",
  beard:      "#e8e0d0",
  beardShade: "#c8c0a8",
  eyes:       "#1a1a2e",
  eyeWhite:   "#ffffff",
  stars:      "#FFD700",
  alert:      "#ff6644",
  think:      "#f39c12",
};

/* ── Pixel-art wizard drawn on a 32×48 grid ── */
function drawWizard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  mood: WizardMood
) {
  const px = Math.floor(Math.min(w / 32, h / 48));
  const ox = Math.floor((w - 32 * px) / 2);
  const oy = Math.floor((h - 48 * px) / 2);

  const p = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * px, oy + y * px, px, px);
  };

  const rect = (x: number, y: number, rw: number, rh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * px, oy + y * px, rw * px, rh * px);
  };

  ctx.clearRect(0, 0, w, h);

  // Bobbing offset
  const bob = Math.floor(Math.sin(frame * 0.08) * 1.2);

  // ── Hat tip (pointy) ──
  p(15, 2 + bob, PAL.hat);
  p(16, 2 + bob, PAL.hat);
  rect(14, 3 + bob, 4, 1, PAL.hat);
  rect(13, 4 + bob, 6, 1, PAL.hat);
  rect(12, 5 + bob, 8, 1, PAL.hat);
  rect(11, 6 + bob, 10, 2, PAL.hat);

  // Hat brim
  rect(9, 8 + bob, 14, 1, PAL.hat);
  // Hat band
  rect(11, 7 + bob, 10, 1, PAL.hatBand);

  // Gem on hat
  const gemFlicker = Math.sin(frame * 0.15) > 0;
  p(15, 5 + bob, gemFlicker ? PAL.staffGem : "#33cc88");
  p(16, 5 + bob, gemFlicker ? "#33cc88" : PAL.staffGem);

  // ── Head ──
  rect(12, 9 + bob, 8, 7, PAL.skin);
  rect(11, 10 + bob, 1, 5, PAL.skin);
  rect(20, 10 + bob, 1, 5, PAL.skin);

  // Eyes
  const blink = frame % 60 < 3;
  if (blink) {
    p(13, 12 + bob, PAL.skinShade);
    p(18, 12 + bob, PAL.skinShade);
  } else {
    p(13, 11 + bob, PAL.eyeWhite);
    p(14, 11 + bob, PAL.eyeWhite);
    p(18, 11 + bob, PAL.eyeWhite);
    p(19, 11 + bob, PAL.eyeWhite);

    // Pupils - shift based on mood
    const pupilOff = mood === "pointing" ? -1 : mood === "thinking" ? 1 : 0;
    p(14 + pupilOff, 12 + bob, PAL.eyes);
    p(18 + pupilOff, 12 + bob, PAL.eyes);
  }

  // Mouth
  if (mood === "celebrating") {
    p(15, 14 + bob, PAL.skinShade);
    p(16, 14 + bob, PAL.skinShade);
  } else if (mood === "concerned") {
    p(15, 15 + bob, PAL.skinShade);
    p(16, 14 + bob, PAL.skinShade);
  } else {
    p(15, 14 + bob, PAL.skinShade);
  }

  // ── Beard ──
  rect(13, 16 + bob, 6, 2, PAL.beard);
  rect(14, 18 + bob, 4, 2, PAL.beard);
  rect(15, 20 + bob, 2, 1, PAL.beardShade);

  // ── Robe / Body ──
  rect(10, 18 + bob, 12, 3, PAL.robe);
  rect(9, 21 + bob, 14, 4, PAL.robe);
  rect(10, 25 + bob, 12, 4, PAL.robe);
  rect(11, 29 + bob, 10, 3, PAL.robe);

  // Robe accent stripe
  rect(15, 21 + bob, 2, 10, PAL.robeLight);

  // Robe bottom trim
  rect(11, 32 + bob, 10, 1, PAL.hatBand);

  // ── Left arm ──
  if (mood === "pointing") {
    // Pointing left
    const pointBob = Math.floor(Math.sin(frame * 0.12) * 0.8);
    rect(4, 20 + bob + pointBob, 6, 2, PAL.robeLight);
    rect(2, 20 + bob + pointBob, 2, 2, PAL.skin);
    // Pointing finger
    p(1, 20 + bob + pointBob, PAL.skin);
  } else {
    rect(8, 19 + bob, 2, 6, PAL.robeLight);
    rect(8, 25 + bob, 2, 1, PAL.skin);
  }

  // ── Right arm + Staff ──
  if (mood === "pointing") {
    // Staff extended to the right, pointing at target
    const pointBob = Math.floor(Math.sin(frame * 0.1) * 0.6);
    rect(22, 19 + bob, 2, 4, PAL.robeLight);
    rect(22, 23 + bob, 2, 1, PAL.skin);
    // Extended staff — angled right
    rect(24, 18 + bob + pointBob, 2, 2, PAL.staffWood);
    rect(26, 17 + bob + pointBob, 2, 2, PAL.staffWood);
    rect(28, 16 + bob + pointBob, 2, 2, PAL.staffWood);
    rect(30, 15 + bob + pointBob, 2, 2, PAL.staffWood);
    // Staff orb at tip — pulsing
    const orbPulse = Math.sin(frame * 0.15) > 0;
    rect(30, 13 + bob + pointBob, 3, 3, orbPulse ? PAL.staffGem : "#33dd99");
    p(31, 12 + bob + pointBob, PAL.staffGem);
  } else {
    rect(22, 19 + bob, 2, 6, PAL.robeLight);
    rect(22, 25 + bob, 2, 1, PAL.skin);
    // Staff vertical
    const staffSway = Math.floor(Math.sin(frame * 0.06) * 0.5);
    rect(25 + staffSway, 8 + bob, 2, 28, PAL.staffWood);
    // Staff orb
    const orbPulse = Math.sin(frame * 0.1) > 0;
    rect(24 + staffSway, 6 + bob, 4, 3, orbPulse ? PAL.staffGem : "#33dd99");
    p(25 + staffSway, 5 + bob, PAL.staffGem);
    p(26 + staffSway, 5 + bob, PAL.staffGem);
  }

  // ── Feet ──
  rect(11, 33 + bob, 4, 2, PAL.robeDark);
  rect(17, 33 + bob, 4, 2, PAL.robeDark);

  // ── Mood-specific effects ──
  if (mood === "celebrating") {
    // Sparkle stars
    const starPositions = [
      [5, 5], [26, 3], [3, 15], [28, 12], [8, 30], [24, 28],
    ];
    starPositions.forEach(([sx, sy], i) => {
      const twinkle = Math.sin(frame * 0.2 + i * 1.5) > 0.2;
      if (twinkle) {
        p(sx, sy + bob, PAL.stars);
      }
    });
  }

  if (mood === "concerned") {
    // Exclamation mark above head
    const alertBlink = frame % 30 < 20;
    if (alertBlink) {
      rect(15, bob, 2, 1, PAL.alert);
    }
  }

  if (mood === "thinking") {
    // Thought dots
    const dotPhase = Math.floor(frame / 15) % 4;
    if (dotPhase >= 1) p(6, 8 + bob, PAL.think);
    if (dotPhase >= 2) p(4, 6 + bob, PAL.think);
    if (dotPhase >= 3) p(3, 4 + bob, PAL.think);
  }
}

/* ── Pixel Wizard Canvas Component ── */
function PixelWizardCanvas({ mood = "idle", size = 160 }: { mood?: WizardMood; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    drawWizard(ctx, canvas.width, canvas.height, frameRef.current, mood);
    frameRef.current++;
    animRef.current = requestAnimationFrame(animate);
  }, [mood]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={Math.floor(size * 1.5)}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/* ── Exported wrapper with framer-motion entrance ── */
export function WizardAvatar3DCanvas({ mood = "idle" }: { mood?: WizardMood }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full h-full flex items-center justify-center"
    >
      <PixelWizardCanvas mood={mood} size={128} />
    </motion.div>
  );
}

export type { WizardMood };

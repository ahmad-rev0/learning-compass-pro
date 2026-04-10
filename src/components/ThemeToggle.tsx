import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="relative flex items-center justify-center w-9 h-9 border-2 border-border bg-card hover:bg-secondary transition-colors pixel-card"
      aria-label="Toggle theme"
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="text-lg"
      >
        {dark ? "🌙" : "☀️"}
      </motion.span>
    </button>
  );
}

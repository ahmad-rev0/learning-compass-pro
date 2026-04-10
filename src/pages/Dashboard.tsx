import { useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, FileText, Users, BarChart3, Inbox, Swords, TrendingUp, Upload, Trophy, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/retroSfx";
import atlasLogo from "@/assets/atlas-logo.png";

const TEACHER_NAV = [
  { to: "/teacher/courses", icon: BookOpen, label: "COURSES" },
  { to: "/teacher/assignments", icon: FileText, label: "ASSIGNMENTS" },
  { to: "/teacher/students", icon: Users, label: "STUDENTS" },
  { to: "/teacher/submissions", icon: Inbox, label: "SUBMISSIONS" },
  { to: "/teacher/analytics", icon: BarChart3, label: "ANALYTICS" },
];

const STUDENT_NAV = [
  { to: "/student/assignments", icon: FileText, label: "ASSIGNMENTS" },
  { to: "/student/progress", icon: TrendingUp, label: "PROGRESS" },
  { to: "/student/quests", icon: Swords, label: "QUESTS" },
  { to: "/student/upload", icon: Upload, label: "UPLOAD" },
  { to: "/student/achievements", icon: Trophy, label: "ACHIEVEMENTS" },
];

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(!sfx.muted);
  const { user, role, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-pixel text-xs">LOADING ROLE...</p>
      </div>
    );
  }

  const nav = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const defaultRoute = role === "teacher" ? "/teacher/courses" : "/student/assignments";

  if (location.pathname === "/dashboard") {
    return <Navigate to={defaultRoute} replace />;
  }

  const toggleSound = () => {
    const muted = sfx.toggle();
    setSoundOn(!muted);
    if (!muted) sfx.click();
  };

  return (
    <div className="min-h-screen bg-background pixel-grid-bg">
      <header className="sticky top-0 z-50 border-b-3 border-border bg-card/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <motion.img
              src={atlasLogo}
              alt="Atlas"
              width={32}
              height={32}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <div>
              <h1 className="font-pixel text-xs md:text-sm tracking-wide text-foreground">
                ATLAS
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {role === "teacher" ? "🎓 Teacher" : "📚 Student"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSound}
              title={soundOn ? "Mute sounds" : "Unmute sounds"}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" className="font-pixel text-[9px]" onClick={() => { sfx.click(); signOut(); }}>
              LOG OUT
            </Button>
          </div>
        </div>

        <div className="container pb-0">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {nav.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => sfx.navigate()}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 font-pixel text-[9px] border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}

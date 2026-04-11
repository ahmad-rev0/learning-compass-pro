import { useState, useEffect, useRef } from "react";
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DemoTour from "@/components/DemoTour";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, FileText, Users, BarChart3, Inbox, Swords, TrendingUp, Upload, Trophy, Volume2, VolumeX, Brain, CalendarDays, Play, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/retroSfx";
import atlasLogo from "@/assets/atlas-logo.png";
import { SplashScreen } from "@/components/SplashScreen";
import { WizardGuide } from "@/components/WizardGuide";

const TEACHER_NAV = [
  { to: "/teacher/courses", icon: BookOpen, label: "COURSES" },
  { to: "/teacher/assignments", icon: FileText, label: "ASSIGNMENTS" },
  { to: "/teacher/students", icon: Users, label: "STUDENTS" },
  { to: "/teacher/submissions", icon: Inbox, label: "SUBMISSIONS" },
  { to: "/teacher/analytics", icon: BarChart3, label: "ANALYTICS" },
];

const STUDENT_NAV = [
  { to: "/student/quests", icon: Swords, label: "QUESTS" },
  { to: "/student/assignments", icon: FileText, label: "ASSIGNMENTS" },
  { to: "/student/progress", icon: TrendingUp, label: "PROGRESS" },
  { to: "/student/upload", icon: Upload, label: "UPLOAD" },
  { to: "/student/achievements", icon: Trophy, label: "ACHIEVEMENTS" },
  { to: "/student/agent", icon: Brain, label: "AGENT" },
  { to: "/student/study-plan", icon: CalendarDays, label: "STUDY PLAN" },
  { to: "/student/self-study", icon: Bot, label: "AI TEACHER" },
];

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(!sfx.muted);
  const [headerVisible, setHeaderVisible] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { user, role, loading, signOut } = useAuth();
  const { isDemoMode, exitDemo } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Hide header when user scrolls past ~120px (start of content area)
  useEffect(() => {
    const handleScroll = () => setHeaderVisible(window.scrollY < 120);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show splash BEFORE any auth/loading guards
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading && !isDemoMode) return null;
  if (!user && !isDemoMode) return <Navigate to="/login" replace />;

  const effectiveRole = isDemoMode ? "student" : role;

  if (!effectiveRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-pixel text-xs">LOADING ROLE...</p>
      </div>
    );
  }

  const nav = effectiveRole === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const defaultRoute = effectiveRole === "teacher" ? "/teacher/courses" : "/student/quests";

  if (location.pathname === "/dashboard") {
    return <Navigate to={defaultRoute} replace />;
  }

  const toggleSound = () => {
    const muted = sfx.toggle();
    setSoundOn(!muted);
    if (!muted) sfx.click();
  };

  const handleExitDemo = () => {
    exitDemo();
    navigate("/login");
  };

  return (
    <div className="dashboard-shell min-h-screen bg-background pixel-grid-bg">
      <header
        className={cn(
          "sticky top-0 z-50 border-b-3 border-border bg-card/95 backdrop-blur-sm transition-all duration-300",
          !headerVisible && "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="container flex items-center justify-between py-2 h-16">
          <div className="flex items-center gap-4">
            <motion.img
              src={atlasLogo}
              alt="Atlas"
              className="w-[70px] h-[70px] object-contain -my-3"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <div>
              <h1 className="font-pixel text-lg md:text-xl tracking-[0.12em] text-foreground">
                ATLAS
              </h1>
              <p className="text-base text-muted-foreground mt-1">
                {isDemoMode ? "🎮 Demo Mode" : effectiveRole === "teacher" ? "🎓 Teacher" : "📚 Student"}
              </p>
            </div>
            {isDemoMode && (
              <Badge className="bg-primary/20 text-primary border-primary/40 font-pixel text-[8px] animate-pulse">
                <Play className="h-3 w-3 mr-1" /> DEMO
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={toggleSound}
              title={soundOn ? "Mute sounds" : "Unmute sounds"}
            >
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            </Button>
            <ThemeToggle />
            {isDemoMode ? (
              <Button variant="outline" size="sm" className="font-pixel text-[9px]" onClick={handleExitDemo}>
                EXIT DEMO
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="font-pixel text-[9px]" onClick={() => { sfx.click(); signOut(); }}>
                LOG OUT
              </Button>
            )}
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
                  data-nav-route={to}
                  onClick={() => sfx.navigate()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 font-pixel text-[9px] border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
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

      <DemoTour />
      {effectiveRole === "student" && <WizardGuide />}
    </div>
  );
}

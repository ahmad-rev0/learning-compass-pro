import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-pixel text-[9px]">LOADING ROLE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pixel-grid-bg">
      <header className="sticky top-0 z-50 border-b-3 border-border bg-card/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-2xl"
            >
              🧭
            </motion.span>
            <div>
              <h1 className="font-pixel text-[10px] md:text-xs tracking-wide text-foreground">
                MOMENTUM COMPASS
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {role === "teacher" ? "🎓 Teacher Dashboard" : "📚 Student Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="font-pixel text-[8px]" onClick={signOut}>
              LOG OUT
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{role === "teacher" ? "🎓" : "📚"}</span>
            <div>
              <h2 className="font-pixel text-[10px] text-foreground">
                WELCOME, {user.email?.split("@")[0]?.toUpperCase()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {role === "teacher"
                  ? "Manage your courses, assignments, and track student progress"
                  : "View assignments, submit work, and track your learning journey"}
              </p>
            </div>
          </div>

          {role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
        </motion.div>
      </main>
    </div>
  );
}

function TeacherDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashCard emoji="📖" title="MY COURSES" desc="Create and manage courses" count={0} />
      <DashCard emoji="📝" title="ASSIGNMENTS" desc="Create and review assignments" count={0} />
      <DashCard emoji="📊" title="ANALYTICS" desc="Student progress & gamification stats" />
      <DashCard emoji="👥" title="STUDENTS" desc="Manage enrolled students" count={0} />
      <DashCard emoji="📬" title="SUBMISSIONS" desc="Review student submissions" count={0} />
      <DashCard emoji="🏆" title="LEADERBOARD" desc="Class-wide gamification rankings" />
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashCard emoji="📖" title="MY COURSES" desc="View enrolled courses" count={0} />
      <DashCard emoji="📝" title="ASSIGNMENTS" desc="View and complete assignments" count={0} />
      <DashCard emoji="🚀" title="MY PROGRESS" desc="XP, level, streaks, and momentum" />
      <DashCard emoji="⚔" title="QUESTS" desc="Active gamification quests" count={0} />
      <DashCard emoji="📤" title="UPLOAD WORK" desc="Submit your own work for gamified learning" />
      <DashCard emoji="🏆" title="ACHIEVEMENTS" desc="Badges and milestones earned" />
    </div>
  );
}

function DashCard({ emoji, title, desc, count }: { emoji: string; title: string; desc: string; count?: number }) {
  return (
    <Card className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-pixel text-[9px] text-foreground">{title}</span>
          {count !== undefined && (
            <span className="ml-auto font-pixel text-[8px] text-muted-foreground">{count}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Sparkles, Brain, Zap, BookOpen, Trophy, Swords, FileText, Upload, TrendingUp, ExternalLink } from "lucide-react";

interface TourStep {
  route: string;
  title: string;
  icon: React.ReactNode;
  highlight: string;
  description: string;
  details: string[];
  techTag: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    route: "/student/assignments",
    title: "📋 Assignment Hub",
    icon: <FileText className="h-5 w-5" />,
    highlight: "Five assignment types power the learning pipeline",
    description: "The platform supports MCQ, Free Text, Code, File Upload, and Study Material assignments. Each type feeds into the AI grading engine differently — code submissions get syntax & logic analysis, essays get depth & argumentation checks.",
    details: [
      "Assignments are created by teachers with answer keys & rubrics",
      "Each submission triggers the full agentic pipeline",
      "Overdue assignments are flagged visually with red borders",
    ],
    techTag: "Learning Management",
  },
  {
    route: "/student/upload",
    title: "🤖 AI Grading Engine",
    icon: <Upload className="h-5 w-5" />,
    highlight: "Submissions are evaluated by AI in real-time",
    description: "When a student submits work, it's sent to the AI Gateway (Gemini) which evaluates content quality, correctness, and completeness. The AI returns structured feedback: a score, strengths, specific improvement areas, and a momentum impact assessment.",
    details: [
      "AI uses tool-calling to return structured JSON grades",
      "Each improvement becomes a potential quest seed",
      "Momentum impact (boost/maintain/concern) drives the state machine",
      "Feedback includes actionable, specific skill gaps — not generic advice",
    ],
    techTag: "AI Gateway + Gemini",
  },
  {
    route: "/student/agent",
    title: "🧠 Agentic State Machine",
    icon: <Brain className="h-5 w-5" />,
    highlight: "The agent detects learning states and intervenes autonomously",
    description: "After each grading, the agent analyzes the last 10 submissions to detect patterns. It evaluates score trends, repeated errors, and momentum trajectory to classify the student into states: Normal, Micro-Stuck, Momentum Dip, or Double Trouble.",
    details: [
      "State machine mirrors the Python backend agent_core.py",
      "Micro-Stuck: 3+ low scores OR 2+ repeated error patterns",
      "Momentum Dip: avg score < 60% OR score trend drops 15+ points",
      "Double Trouble: both micro-stuck AND momentum dip simultaneously",
      "Proactive checks run autonomously to detect inactivity & skill gaps",
      "Every decision is logged with confidence scores & reasoning",
    ],
    techTag: "Agentic Loop",
  },
  {
    route: "/student/quests",
    title: "⚔️ Exa-Powered Quest Generation",
    icon: <Swords className="h-5 w-5" />,
    highlight: "Each improvement area triggers an Exa search for targeted resources",
    description: "The quest engine takes each AI-identified improvement and searches Exa AI for the most relevant tutorial, documentation, or guide. Quests are generated per-improvement (up to 4 per submission), with XP rewards scaled by severity.",
    details: [
      "Exa API searches with auto-prompting for best results",
      "Recovery quests: fix specific bugs (40-60 XP)",
      "Growth quests: expand skills (25-35 XP)",
      "Pattern alerts: recurring errors across multiple submissions",
      "Resource URLs link to Real Python, GeeksForGeeks, official docs, etc.",
      "Inactivity nudge timer bounces quests to re-engage students",
    ],
    techTag: "Exa AI + Quest Engine",
  },
  {
    route: "/student/progress",
    title: "📊 Gamification & Momentum",
    icon: <TrendingUp className="h-5 w-5" />,
    highlight: "XP, levels, streaks, and momentum score track learning health",
    description: "The gamification system awards XP for submissions and quest completions. Momentum is the key health metric — it rises with good scores and quest completions, drops when the agent detects struggling states. The agent uses momentum to decide intervention urgency.",
    details: [
      "XP earned = (score% × 50) + 10 base per submission",
      "Level = floor(totalXP / 100) + 1",
      "Momentum adjusts: +8 for boost, -15 for double_trouble",
      "Streak tracks consecutive days with submissions",
      "Low momentum (<25%) triggers emergency recovery interventions",
    ],
    techTag: "XP System",
  },
  {
    route: "/student/achievements",
    title: "🏆 AI-Generated Achievements",
    icon: <Trophy className="h-5 w-5" />,
    highlight: "Personalized challenges generated by analyzing your performance profile",
    description: "The achievement engine uses AI to analyze your submission history, identifying weaknesses to target and strengths to celebrate. It generates 3-5 bespoke challenges (bronze to diamond difficulty) with Exa-found study resources attached.",
    details: [
      "Categories: Weakness Buster, Strength Mastery, Exploration, Consistency, Comeback",
      "Difficulties: Bronze (30 XP) → Silver (40 XP) → Gold (50 XP) → Diamond (75 XP)",
      "Each achievement can have an Exa-curated resource URL",
      "Milestone badges unlock automatically (first submit, streaks, perfect scores)",
      "Claiming achievements awards XP and updates your level",
    ],
    techTag: "Achievement Engine + Exa",
  },
  {
    route: "/student/study-plan",
    title: "📚 AI Study Plan Generator",
    icon: <BookOpen className="h-5 w-5" />,
    highlight: "Weekly study plans synthesized from performance data + Exa resources",
    description: "The study plan engine analyzes your performance gaps, fetches relevant resources via Exa, and builds a personalized weekly curriculum. Each day has a focus area (weakness/strength/exploration) with timed sessions and linked resources.",
    details: [
      "Agent reasoning explains WHY each topic was chosen",
      "Daily topics include Exa-found resource links",
      "Focus types: weakness (drill), strength (advance), exploration (broaden)",
      "Milestones with XP bonuses for completing weekly goals",
      "Difficulty adapts based on your current level and score trends",
    ],
    techTag: "Study Plan + Exa",
  },
];

export default function DemoTour() {
  const { isDemoMode } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Sync step with current route
  useEffect(() => {
    const idx = TOUR_STEPS.findIndex((s) => s.route === location.pathname);
    if (idx !== -1) setCurrentStepIndex(idx);
  }, [location.pathname]);

  if (!isDemoMode || dismissed) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isOnStepRoute = step.route === location.pathname;

  const goToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    navigate(TOUR_STEPS[idx].route);
    setMinimized(false);
  };

  const next = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) goToStep(currentStepIndex + 1);
  };

  const prev = () => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  };

  if (minimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 z-[60]"
      >
        <Button
          onClick={() => setMinimized(false)}
          className="h-12 w-12 rounded-full bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.route}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-4 right-4 z-[60] w-[380px] max-w-[calc(100vw-2rem)]"
      >
        <Card className="border-2 border-primary/40 bg-card/98 backdrop-blur-md shadow-xl shadow-primary/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-pixel text-[8px] text-primary">GUIDED TOUR</span>
              <Badge variant="outline" className="text-[7px] font-pixel">
                {currentStepIndex + 1}/{TOUR_STEPS.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMinimized(true)}>
                <span className="text-xs">—</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(true)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <CardContent className="px-4 pb-4 pt-1 space-y-3">
            {/* Step title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-primary">{step.icon}</span>
                <h3 className="font-pixel text-[10px] text-foreground">{step.title}</h3>
              </div>
              <Badge variant="outline" className="text-[7px] bg-accent/10 text-accent border-accent/30">
                {step.techTag}
              </Badge>
            </div>

            {/* Highlight */}
            <div className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
              <p className="text-xs text-primary font-medium">{step.highlight}</p>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

            {/* Details */}
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {step.details.map((d, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Zap className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {TOUR_STEPS.map((s, i) => (
                <button
                  key={s.route}
                  onClick={() => goToStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStepIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                className="font-pixel text-[7px] h-7"
                onClick={prev}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" /> PREV
              </Button>

              {!isOnStepRoute && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="font-pixel text-[7px] h-7"
                  onClick={() => navigate(step.route)}
                >
                  GO TO PAGE
                </Button>
              )}

              <Button
                variant={currentStepIndex === TOUR_STEPS.length - 1 ? "default" : "outline"}
                size="sm"
                className="font-pixel text-[7px] h-7"
                onClick={currentStepIndex === TOUR_STEPS.length - 1 ? () => setDismissed(true) : next}
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  "FINISH ✓"
                ) : (
                  <>NEXT <ChevronRight className="h-3 w-3 ml-0.5" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

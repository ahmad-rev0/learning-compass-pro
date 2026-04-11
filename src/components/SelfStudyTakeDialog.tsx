import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Play, CheckCircle2, XCircle, ArrowRight, Trophy, BookOpen } from "lucide-react";

interface SelfStudyTakeDialogProps {
  assignment: any;
}

export function SelfStudyTakeDialog({ assignment }: SelfStudyTakeDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const content = assignment.content as any;
  const type = assignment.type;

  const isCompleted = assignment.status === "completed" || assignment.status === "graded";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={isCompleted ? "outline" : "default"}
          className="font-pixel text-[7px] gap-1 shrink-0"
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              {assignment.score !== null ? `${assignment.score}%` : "REVIEW"}
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> START
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[11px] flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {content?.title || `${assignment.topic} Practice`}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[9px]">{assignment.subject}</Badge>
            <Badge variant="outline" className="text-[9px]">{assignment.difficulty}</Badge>
            <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">+{assignment.xp_reward} XP</Badge>
          </div>
        </DialogHeader>

        {type === "mcq" && content?.questions && (
          <McqQuiz
            assignment={assignment}
            questions={content.questions}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments"] });
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments-list"] });
            }}
            isCompleted={isCompleted}
          />
        )}

        {type === "free_text" && content?.questions && (
          <FreeTextQuiz
            assignment={assignment}
            questions={content.questions}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments"] });
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments-list"] });
            }}
            isCompleted={isCompleted}
          />
        )}

        {type === "code" && content?.challenges && (
          <CodeChallenge
            assignment={assignment}
            challenges={content.challenges}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments"] });
              queryClient.invalidateQueries({ queryKey: ["self-study-assignments-list"] });
            }}
            isCompleted={isCompleted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── MCQ Quiz ──
function McqQuiz({
  assignment,
  questions,
  onComplete,
  isCompleted,
}: {
  assignment: any;
  questions: any[];
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(isCompleted);
  const [score, setScore] = useState<number | null>(assignment.score);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Grade locally
      let correct = 0;
      questions.forEach((q, i) => {
        const userAnswer = answers[i] || "";
        // Extract letter from option like "A. O(1)" → "A"
        const userLetter = userAnswer.charAt(0).toUpperCase();
        if (userLetter === q.correct?.charAt(0)?.toUpperCase()) {
          correct++;
        }
      });
      const pct = Math.round((correct / questions.length) * 100);

      const { error } = await supabase
        .from("self_study_assignments")
        .update({
          student_answer: JSON.stringify(answers),
          score: pct,
          status: "completed",
        })
        .eq("id", assignment.id);
      if (error) throw error;
      return pct;
    },
    onSuccess: (pct) => {
      setScore(pct);
      setShowResults(true);
      onComplete();
      toast.success(`Quiz complete! Score: ${pct}%`, {
        description: pct >= 80 ? "Great job! 🎉" : "Keep practicing! 💪",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = questions[currentQ];
  if (!q) return null;

  if (showResults) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <Trophy className="h-10 w-10 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-foreground">{score ?? assignment.score}%</p>
          <p className="text-sm text-muted-foreground">
            {(score ?? assignment.score) >= 80 ? "Excellent work!" : "Room for improvement"}
          </p>
        </div>
        {questions.map((q, i) => {
          const userAnswer = answers[i] || (assignment.student_answer ? JSON.parse(assignment.student_answer)[i] : "");
          const userLetter = (userAnswer || "").charAt(0).toUpperCase();
          const isCorrect = userLetter === q.correct?.charAt(0)?.toUpperCase();
          return (
            <Card key={i} className={`border ${isCorrect ? "border-green-500/30" : "border-red-500/30"}`}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-xs text-green-400 mt-1">Correct: {q.correct}</p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[9px]">
          Question {currentQ + 1} of {questions.length}
        </Badge>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentQ
                  ? "bg-primary"
                  : answers[i]
                  ? "bg-primary/40"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={currentQ}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <p className="text-sm font-medium text-foreground">{q.question}</p>

        <RadioGroup
          value={answers[currentQ] || ""}
          onValueChange={(val) => setAnswers((prev) => ({ ...prev, [currentQ]: val }))}
        >
          {q.options?.map((opt: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: opt }))}
            >
              <RadioGroupItem value={opt} id={`q${currentQ}-opt${i}`} />
              <Label htmlFor={`q${currentQ}-opt${i}`} className="cursor-pointer flex-1 text-sm">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </motion.div>

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
        >
          Back
        </Button>

        {currentQ < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentQ((p) => p + 1)}
            disabled={!answers[currentQ]}
            className="gap-1"
          >
            Next <ArrowRight className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => submitMutation.mutate()}
            disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}
            className="gap-1"
          >
            {submitMutation.isPending ? "Grading..." : "Submit Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Free Text Quiz ──
function FreeTextQuiz({
  assignment,
  questions,
  onComplete,
  isCompleted,
}: {
  assignment: any;
  questions: any[];
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("self_study_assignments")
        .update({
          student_answer: JSON.stringify(answers),
          status: "completed",
          score: 100, // Free text is self-paced, mark as complete
        })
        .eq("id", assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onComplete();
      toast.success("Responses submitted! 🎉");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isCompleted) {
    const savedAnswers = assignment.student_answer ? JSON.parse(assignment.student_answer) : {};
    return (
      <div className="space-y-4">
        <div className="text-center py-2">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        {questions.map((q, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="py-3 space-y-2">
              <p className="text-sm font-medium text-foreground">{q.question}</p>
              {savedAnswers[i] && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{savedAnswers[i]}</p>
              )}
              {q.sample_answer && (
                <div className="text-xs text-primary/80 mt-2">
                  <span className="font-semibold">Sample answer: </span>{q.sample_answer}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="py-3 space-y-2">
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            {q.rubric && (
              <p className="text-xs text-muted-foreground italic">Rubric: {q.rubric}</p>
            )}
            <Textarea
              placeholder="Write your response..."
              value={answers[i] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              className="min-h-[100px] text-sm"
            />
          </CardContent>
        </Card>
      ))}
      <Button
        onClick={() => submitMutation.mutate()}
        disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}
        className="w-full"
      >
        {submitMutation.isPending ? "Submitting..." : "Submit Responses"}
      </Button>
    </div>
  );
}

// ── Code Challenge ──
function CodeChallenge({
  assignment,
  challenges,
  onComplete,
  isCompleted,
}: {
  assignment: any;
  challenges: any[];
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(
    () => challenges.reduce((acc, c, i) => ({ ...acc, [i]: c.starter_code || "" }), {})
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("self_study_assignments")
        .update({
          student_answer: JSON.stringify(answers),
          status: "completed",
          score: 100,
        })
        .eq("id", assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onComplete();
      toast.success("Code submitted! 🎉");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isCompleted) {
    const savedAnswers = assignment.student_answer ? JSON.parse(assignment.student_answer) : {};
    return (
      <div className="space-y-4">
        <div className="text-center py-2">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        {challenges.map((c, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="py-3 space-y-2">
              <p className="text-sm font-medium text-foreground">{c.problem}</p>
              {savedAnswers[i] && (
                <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto font-mono">{savedAnswers[i]}</pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map((c, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="py-3 space-y-3">
            <p className="text-sm font-medium text-foreground">{c.problem}</p>
            {c.language && (
              <Badge variant="outline" className="text-[8px]">{c.language}</Badge>
            )}
            {c.hint && (
              <p className="text-xs text-muted-foreground italic">💡 {c.hint}</p>
            )}
            <Textarea
              value={answers[i] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              className="min-h-[160px] font-mono text-sm"
              placeholder="Write your code here..."
            />
            {c.test_cases && c.test_cases.length > 0 && (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-muted-foreground">Test Cases:</p>
                {c.test_cases.map((tc: any, j: number) => (
                  <div key={j} className="flex gap-4 text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                    <span>Input: <code className="text-foreground">{tc.input}</code></span>
                    <span>Expected: <code className="text-foreground">{tc.expected_output}</code></span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button
        onClick={() => submitMutation.mutate()}
        disabled={submitMutation.isPending}
        className="w-full"
      >
        {submitMutation.isPending ? "Submitting..." : "Submit Code"}
      </Button>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, BookOpen, Code, FileText, Sparkles, Loader2, CheckCircle2, Clock, Brain } from "lucide-react";

const SUBJECTS = [
  "Mathematics", "Computer Science", "Physics", "Chemistry",
  "Biology", "English", "History", "Economics",
];

const TYPES = [
  { value: "mcq", label: "Multiple Choice", icon: CheckCircle2 },
  { value: "free_text", label: "Free Text", icon: FileText },
  { value: "code", label: "Coding", icon: Code },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", color: "text-green-400" },
  { value: "intermediate", label: "Intermediate", color: "text-yellow-400" },
  { value: "advanced", label: "Advanced", color: "text-red-400" },
];

export default function SelfStudy() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("intermediate");

  const userId = isDemoMode ? "demo-user" : user?.id;

  // Fetch existing self-study assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["self-study-assignments", userId],
    queryFn: async () => {
      if (isDemoMode) return [];
      const { data, error } = await supabase
        .from("self_study_assignments")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: async (mode: "request_form" | "one_click") => {
      if (isDemoMode) {
        // Demo mode mock
        return {
          assignment: {
            id: crypto.randomUUID(),
            subject: mode === "one_click" ? "Mathematics" : subject,
            topic: mode === "one_click" ? "Algebra Review" : topic,
            type: mode === "one_click" ? "mcq" : type,
            difficulty: mode === "one_click" ? "intermediate" : difficulty,
            status: "pending",
            xp_reward: 25,
            created_at: new Date().toISOString(),
            content: { title: "AI-Generated Practice", questions: [] },
          },
        };
      }

      const payload: Record<string, string> = { mode };
      if (mode === "request_form") {
        if (!subject || !topic) throw new Error("Please fill in subject and topic");
        payload.subject = subject;
        payload.topic = topic;
        payload.type = type;
        payload.difficulty = difficulty;
      }

      const { data, error } = await supabase.functions.invoke("generate-assignment", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Assignment generated!", {
        description: `${data.assignment?.subject}: ${data.assignment?.topic}`,
      });
      queryClient.invalidateQueries({ queryKey: ["self-study-assignments"] });
      setSubject("");
      setTopic("");
    },
    onError: (err: Error) => {
      toast.error("Generation failed", { description: err.message });
    },
  });

  const pendingCount = assignments?.filter((a: any) => a.status === "pending").length || 0;
  const completedCount = assignments?.filter((a: any) => a.status === "completed" || a.status === "graded").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-mono text-foreground">AI Teaching Agent</h1>
          <p className="text-sm text-muted-foreground">Your personal AI teacher generates assignments tailored to you</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-lg font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-lg font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{assignments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">My Assignments ({assignments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* One-click generate */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Quick Generate
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI analyzes your weaknesses and generates the best assignment for you
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateMutation.mutate("one_click")}
                disabled={generateMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {generateMutation.isPending ? "AI is analyzing your performance..." : "Generate Smart Assignment"}
              </Button>
            </CardContent>
          </Card>

          {/* Request form */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                Custom Request
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Specify exactly what you want to practice
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g. Quadratic equations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">
                            <t.icon className="w-3 h-3" />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          <span className={d.color}>{d.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => generateMutation.mutate("request_form")}
                disabled={generateMutation.isPending || !subject || !topic}
                className="w-full gap-2"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generateMutation.isPending ? "Generating..." : "Generate Assignment"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !assignments?.length ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-10 text-center">
                <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No assignments yet. Generate your first one above!</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {assignments.map((a: any, i: number) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AssignmentCard assignment={a} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: any }) {
  const typeIcon: Record<string, typeof Code> = {
    mcq: CheckCircle2,
    free_text: FileText,
    code: Code,
  };
  const Icon = typeIcon[assignment.type] || BookOpen;

  const diffColors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-yellow-500/20 text-yellow-400",
    advanced: "bg-red-500/20 text-red-400",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    graded: "bg-primary/20 text-primary",
  };

  const content = assignment.content as any;

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-muted/50 mt-0.5">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {content?.title || `${assignment.topic} Practice`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {assignment.subject} · {assignment.topic}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`text-[10px] ${diffColors[assignment.difficulty] || ""}`}>
                  {assignment.difficulty}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${statusColors[assignment.status] || ""}`}>
                  {assignment.status}
                </Badge>
                <span className="text-[10px] text-primary font-mono">+{assignment.xp_reward} XP</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {new Date(assignment.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

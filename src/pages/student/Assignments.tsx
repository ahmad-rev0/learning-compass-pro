import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { demoAssignments, demoSubmissions } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Code, Upload, BookOpen, List, Clock, CheckCircle, Send, Bot } from "lucide-react";
import { SelfStudyTakeDialog } from "@/components/SelfStudyTakeDialog";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  mcq: { icon: List, label: "Multiple Choice", color: "bg-primary/10 text-primary" },
  free_text: { icon: FileText, label: "Free Text", color: "bg-accent/10 text-accent" },
  code: { icon: Code, label: "Code", color: "bg-warning/10 text-warning" },
  file_upload: { icon: Upload, label: "File Upload", color: "bg-destructive/10 text-destructive" },
  study_material: { icon: BookOpen, label: "Study Material", color: "bg-success/10 text-success" },
};

export default function StudentAssignments() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: async () => {
      if (isDemoMode) return demoAssignments;
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  // Fetch self-study (AI Teacher) assignments
  const { data: selfStudyAssignments = [] } = useQuery({
    queryKey: ["self-study-assignments-list", user?.id],
    queryFn: async () => {
      if (isDemoMode) return [];
      const { data, error } = await supabase
        .from("self_study_assignments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isDemoMode,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () => {
      if (isDemoMode) return demoSubmissions.map(s => ({ assignment_id: s.assignment_id, status: s.status, score: s.score }));
      const { data, error } = await supabase
        .from("submissions")
        .select("assignment_id, status, score")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]));

  return (
    <div className="space-y-4" data-wizard-target="assignments">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" /> MY ASSIGNMENTS
      </h2>

      {/* Self-study assignments section */}
      {selfStudyAssignments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-primary" /> AI TEACHER ASSIGNMENTS
          </h3>
          <div className="space-y-2">
            {selfStudyAssignments.map((a: any, i: number) => {
              const meta = TYPE_META[a.type] || TYPE_META.free_text;
              const Icon = meta.icon;
              const content = a.content as any;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`border-2 ${a.status === "completed" || a.status === "graded" ? "border-success/30" : "border-primary/30"}`}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded shrink-0 ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-pixel text-[9px] text-foreground truncate">
                              {content?.title || `${a.topic} Practice`}
                            </p>
                            <Badge variant="secondary" className="text-[7px] bg-primary/10 text-primary">AI Generated</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{a.subject} · {a.topic}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[7px]">{meta.label}</Badge>
                            <Badge variant="outline" className="text-[7px]">{a.difficulty}</Badge>
                            <span className="text-[10px] text-primary font-mono">+{a.xp_reward} XP</span>
                            {(a.status === "completed" || a.status === "graded") && (
                              <span className="text-xs text-success flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> {a.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <SelfStudyTakeDialog assignment={a} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course assignments section */}
      {(assignments.length > 0 || selfStudyAssignments.length === 0) && (
        <>
          {selfStudyAssignments.length > 0 && assignments.length > 0 && (
            <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> COURSE ASSIGNMENTS
            </h3>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : assignments.length === 0 && selfStudyAssignments.length === 0 ? (
            <Card className="border-2 border-dashed border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                No assignments yet. You'll see them here once your teacher creates them, or generate your own via the AI Teacher tab.
              </CardContent>
            </Card>
          ) : assignments.length === 0 ? null : (
            <div className="space-y-3">
              {assignments.map((a: any, i: number) => {
                const meta = TYPE_META[a.type] || TYPE_META.free_text;
                const Icon = meta.icon;
                const sub = submissionMap.get(a.id);
                const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !sub;

                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className={`border-2 ${sub ? "border-success/30" : isOverdue ? "border-destructive/30" : "border-border"}`}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded shrink-0 ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-pixel text-[9px] text-foreground truncate">{a.title}</p>
                              {!a.is_mandatory && <Badge variant="secondary" className="text-[7px]">Optional</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{a.courses?.title}</p>
                            {a.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className="text-[7px]">{meta.label}</Badge>
                              {a.due_date && (
                                <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                                  <Clock className="h-3 w-3" />
                                  {new Date(a.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {sub && (
                                <span className="text-xs text-success flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {sub.status}{sub.score !== null ? ` · ${sub.score}pts` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          {!sub && !isDemoMode && (
                            <SubmitDialog assignment={a} />
                          )}
                          {!sub && isDemoMode && (
                            <Button size="sm" className="font-pixel text-[7px] gap-1 shrink-0" disabled>
                              <Send className="h-3 w-3" /> SUBMIT
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmitDialog({ assignment }: { assignment: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mcqAnswer, setMcqAnswer] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;
      let submissionContent = content;

      if (assignment.type === "mcq") {
        submissionContent = mcqAnswer;
      }

      if (assignment.type === "file_upload" && file) {
        const path = `${user!.id}/${assignment.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(path, file);
        if (uploadError) throw uploadError;
        fileUrl = path;
      }

      const { error } = await supabase.from("submissions").insert({
        assignment_id: assignment.id,
        student_id: user!.id,
        content: submissionContent || null,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["student-assignments"] });
      toast.success("Submitted! 🎉");
      setOpen(false);
      setContent("");
      setFile(null);
      setMcqAnswer("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mcqOptions = assignment.answer_key?.options || assignment.answer_key?.choices || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-pixel text-[7px] gap-1 shrink-0">
          <Send className="h-3 w-3" /> SUBMIT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[10px]">{assignment.title}</DialogTitle>
        </DialogHeader>
        {assignment.description && (
          <p className="text-sm text-muted-foreground">{assignment.description}</p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-4">
          {assignment.type === "mcq" && mcqOptions.length > 0 ? (
            <RadioGroup value={mcqAnswer} onValueChange={setMcqAnswer}>
              {mcqOptions.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : assignment.type === "mcq" ? (
            <Input placeholder="Your answer" value={content} onChange={(e) => setContent(e.target.value)} required />
          ) : null}

          {assignment.type === "free_text" && (
            <Textarea
              placeholder="Write your response..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
              required
            />
          )}

          {assignment.type === "code" && (
            <Textarea
              placeholder="Paste or write your code here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[160px] text-sm"
              required
            />
          )}

          {assignment.type === "file_upload" && (
            <div className="space-y-2">
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">Upload your file (PDF, doc, image, etc.)</p>
            </div>
          )}

          {assignment.type === "study_material" && (
            <Textarea
              placeholder="Share your notes, summary, or reflections on the material..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
              required
            />
          )}

          <Button type="submit" className="w-full font-pixel text-[8px]" disabled={submit.isPending}>
            {submit.isPending ? "SUBMITTING..." : "SUBMIT RESPONSE"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

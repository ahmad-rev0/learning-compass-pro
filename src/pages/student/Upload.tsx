import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { demoAssignments, demoLastFeedback } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2, FileText, BookOpen } from "lucide-react";
import { sfx } from "@/lib/retroSfx";

export default function StudentUpload() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [type, setType] = useState("free_text");
  const [file, setFile] = useState<File | null>(null);
  const [assignmentId, setAssignmentId] = useState("");
  const [grading, setGrading] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<any>(isDemoMode ? demoLastFeedback : null);
  const [mode, setMode] = useState<"assignment" | "external">("external");
  const [externalSubject, setExternalSubject] = useState("");
  const [externalTopic, setExternalTopic] = useState("");

  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments-for-upload"],
    queryFn: async () => {
      if (isDemoMode) return demoAssignments.map(a => ({ id: a.id, title: a.title, type: a.type }));
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user || isDemoMode,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (isDemoMode) {
        toast.info("Submissions are view-only in demo mode");
        return { graded: false };
      }

      if (mode === "assignment") {
        if (!assignmentId) throw new Error("Please select an assignment");
        if (!content && !file) throw new Error("Please provide content or upload a file");

        let fileUrl: string | null = null;
        if (file) {
          const path = `${user!.id}/${assignmentId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("submissions")
            .upload(path, file);
          if (uploadError) throw uploadError;
          fileUrl = path;
        }

        const { data: submission, error: subError } = await supabase
          .from("submissions")
          .insert({
            assignment_id: assignmentId,
            student_id: user!.id,
            content: content || null,
            file_url: fileUrl,
            status: "pending",
          })
          .select("id")
          .single();

        if (subError) throw subError;

        setGrading(true);
        const { data: gradeData, error: gradeError } = await supabase.functions.invoke(
          "grade-submission",
          { body: { submission_id: submission.id } }
        );

        if (gradeError) {
          console.error("Grading error:", gradeError);
          toast.info("Submitted! AI grading will process shortly.");
          return { graded: false };
        }

        return { graded: true, ...gradeData };
      } else {
        // External document mode
        if (!content && !file) throw new Error("Please provide content or upload a file");
        if (!externalSubject.trim()) throw new Error("Please enter a subject");

        let fileContent = content;
        if (file && !content) {
          // Read text from file if no content typed
          try {
            const rawText = await file.text();
            // Sanitize: remove null bytes and invalid unicode surrogates
            fileContent = rawText.replace(/\0/g, "").replace(/[\uD800-\uDFFF]/g, "").slice(0, 50000);
          } catch {
            fileContent = `(File uploaded: ${file.name}, ${(file.size / 1024).toFixed(1)} KB — binary file, text extraction not available)`;
          }
        }

        setGrading(true);

        // Use the self-study system to grade external documents
        const { data: assignment, error: createError } = await supabase
          .from("self_study_assignments")
          .insert({
            user_id: user!.id,
            subject: externalSubject.trim(),
            topic: externalTopic.trim() || "General",
            type: "free_text",
            difficulty: "intermediate",
            content: { title: `${externalSubject}: ${externalTopic || "External Submission"}`, question: "External document submitted for AI review." },
            student_answer: fileContent || null,
            status: "completed",
            generated_by: "external_upload",
          })
          .select("id")
          .single();

        if (createError) throw createError;

        // Call grade function via self-study grading
        const { data: gradeData, error: gradeError } = await supabase.functions.invoke(
          "grade-submission",
          { body: { self_study_id: assignment.id } }
        );

        if (gradeError) {
          console.error("Grading error:", gradeError);
          toast.info("Submitted! AI grading will process shortly.");
          return { graded: false };
        }

        return { graded: true, ...gradeData };
      }
    },
    onSuccess: (result) => {
      setGrading(false);
      if (result?.graded && result?.grade) {
        setLastFeedback(result.grade);
        sfx.xp();
        toast.success(`Graded! Score: ${result.grade.score} | +${result.xp_earned || 0} XP ⚡`);
      }
      setContent("");
      setFile(null);
      setAssignmentId("");
      setExternalSubject("");
      setExternalTopic("");
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      queryClient.invalidateQueries({ queryKey: ["badge-unlocks"] });
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["self-study-assignments"] });
    },
    onError: (e: any) => {
      setGrading(false);
      sfx.error();
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-4" data-wizard-target="upload">
      <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
        <Upload className="h-4 w-4" /> SUBMIT WORK
      </h2>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "external" ? "default" : "outline"}
          size="sm"
          className="font-pixel text-[8px] flex-1"
          onClick={() => { setMode("external"); sfx.click(); }}
        >
          <FileText className="h-3 w-3 mr-1" /> EXTERNAL DOC
        </Button>
        <Button
          variant={mode === "assignment" ? "default" : "outline"}
          size="sm"
          className="font-pixel text-[8px] flex-1"
          onClick={() => { setMode("assignment"); sfx.click(); }}
        >
          <BookOpen className="h-3 w-3 mr-1" /> COURSE ASSIGNMENT
        </Button>
      </div>

      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px]">
            {mode === "external" ? "📄 SUBMIT EXTERNAL DOCUMENT" : "📤 SUBMIT COURSE ASSIGNMENT"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "external"
              ? "Upload any document or paste text for AI feedback — no course assignment needed!"
              : "Submit work for a specific course assignment."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="space-y-4">
            {mode === "assignment" ? (
              <Select value={assignmentId} onValueChange={setAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={assignments.length === 0 ? "No assignments available" : "Select assignment..."} />
                </SelectTrigger>
                <SelectContent>
                  {assignments.length === 0 ? (
                    <SelectItem value="__none" disabled>No assignments — try External Doc mode</SelectItem>
                  ) : (
                    assignments.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title} ({a.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Subject (e.g. Physics)"
                  value={externalSubject}
                  onChange={(e) => setExternalSubject(e.target.value)}
                />
                <Input
                  placeholder="Topic (e.g. Thermodynamics)"
                  value={externalTopic}
                  onChange={(e) => setExternalTopic(e.target.value)}
                />
              </div>
            )}

            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free_text">📝 Notes / Essay</SelectItem>
                <SelectItem value="code">💻 Code</SelectItem>
                <SelectItem value="file_upload">📎 File Upload</SelectItem>
              </SelectContent>
            </Select>

            {type !== "file_upload" && (
              <Textarea
                placeholder={type === "code" ? "Paste your code here..." : "Write or paste your content here..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`min-h-[150px] ${type === "code" ? "text-sm" : ""}`}
              />
            )}

            {type === "file_upload" && (
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            )}

            <Button
              type="submit"
              className="w-full font-pixel text-[8px]"
              disabled={upload.isPending || grading || isDemoMode}
            >
              {isDemoMode ? (
                "VIEW-ONLY IN DEMO"
              ) : grading ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> AI GRADING...</>
              ) : upload.isPending ? (
                "UPLOADING..."
              ) : (
                "SUBMIT & GRADE ⚡"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastFeedback && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-[9px]">🤖 AI FEEDBACK {isDemoMode ? "(DEMO)" : ""}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-pixel text-[14px] text-foreground">{lastFeedback.score}</span>
              <span className="text-sm text-muted-foreground">points</span>
              <span className={`font-pixel text-[8px] ml-auto ${
                lastFeedback.momentum_impact === "boost" ? "text-success" :
                lastFeedback.momentum_impact === "concern" ? "text-destructive" : "text-muted-foreground"
              }`}>
                {lastFeedback.momentum_impact === "boost" ? "🚀 MOMENTUM BOOST" :
                 lastFeedback.momentum_impact === "concern" ? "⚠️ NEEDS ATTENTION" : "➡️ STEADY"}
              </span>
            </div>

            <p className="text-sm text-foreground">{lastFeedback.feedback}</p>

            {lastFeedback.strengths?.length > 0 && (
              <div>
                <p className="font-pixel text-[7px] text-success mb-1">💪 STRENGTHS</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {lastFeedback.strengths.map((s: string, i: number) => (
                    <li key={i}>✓ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {lastFeedback.improvements?.length > 0 && (
              <div>
                <p className="font-pixel text-[7px] text-warning mb-1">📈 TO IMPROVE</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {lastFeedback.improvements.map((s: string, i: number) => (
                    <li key={i}>→ {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

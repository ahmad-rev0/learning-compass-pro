import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { sfx } from "@/lib/retroSfx";

export default function StudentUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [type, setType] = useState("free_text");
  const [file, setFile] = useState<File | null>(null);
  const [assignmentId, setAssignmentId] = useState("");
  const [grading, setGrading] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<any>(null);

  const { data: assignments = [] } = useQuery({
    queryKey: ["student-assignments-for-upload"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upload = useMutation({
    mutationFn: async () => {
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

      // Create submission
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

      // Trigger AI grading
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
    },
    onSuccess: (result) => {
      setGrading(false);
      if (result?.graded && result?.grade) {
        setLastFeedback(result.grade);
        toast.success(`Graded! Score: ${result.grade.score} | +${result.xp_earned} XP ⚡`);
      }
      setContent("");
      setFile(null);
      setAssignmentId("");
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      queryClient.invalidateQueries({ queryKey: ["badge-unlocks"] });
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
    },
    onError: (e: any) => {
      setGrading(false);
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Upload className="h-4 w-4" /> SUBMIT WORK
      </h2>

      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[9px]">📤 SUBMIT FOR AI GRADING</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit your work and get instant AI-powered feedback, XP, and personalized quests!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="space-y-4">
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment..." />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} ({a.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                placeholder={type === "code" ? "Paste your code here..." : "Write your answer here..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`min-h-[150px] ${type === "code" ? "font-mono text-sm" : ""}`}
              />
            )}

            {type === "file_upload" && (
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            )}

            <Button
              type="submit"
              className="w-full font-pixel text-[8px]"
              disabled={upload.isPending || grading}
            >
              {grading ? (
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

      {/* AI Feedback display */}
      {lastFeedback && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-[9px]">🤖 AI FEEDBACK</CardTitle>
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

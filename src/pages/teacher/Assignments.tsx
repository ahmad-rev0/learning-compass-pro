import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, FileText, Code, Upload, BookOpen, List, Trash2 } from "lucide-react";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  mcq: { icon: List, label: "Multiple Choice", color: "bg-primary/10 text-primary" },
  free_text: { icon: FileText, label: "Free Text", color: "bg-accent/10 text-accent" },
  code: { icon: Code, label: "Code", color: "bg-warning/10 text-warning" },
  file_upload: { icon: Upload, label: "File Upload", color: "bg-destructive/10 text-destructive" },
  study_material: { icon: BookOpen, label: "Study Material", color: "bg-success/10 text-success" },
};

export default function TeacherAssignments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("free_text");
  const [courseId, setCourseId] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [answerKey, setAnswerKey] = useState("");

  const { data: courses = [] } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createAssignment = useMutation({
    mutationFn: async () => {
      let parsedKey = null;
      if (answerKey.trim()) {
        try {
          parsedKey = JSON.parse(answerKey);
        } catch {
          throw new Error("Answer key must be valid JSON");
        }
      }
      const { error } = await supabase.from("assignments").insert({
        course_id: courseId,
        title,
        description: description || null,
        type,
        is_mandatory: isMandatory,
        due_date: dueDate || null,
        answer_key: parsedKey,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Assignment created!");
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Assignment deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("free_text");
    setCourseId("");
    setIsMandatory(true);
    setDueDate("");
    setAnswerKey("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" /> ASSIGNMENTS
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-pixel text-[8px] gap-1" disabled={courses.length === 0}>
              <Plus className="h-3 w-3" /> NEW ASSIGNMENT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-pixel text-[10px]">CREATE ASSIGNMENT</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createAssignment.mutate(); }} className="space-y-3">
              <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Instructions / description" value={description} onChange={(e) => setDescription(e.target.value)} />

              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mandatory</span>
                <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
              </div>

              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Answer key (JSON, optional)</label>
                <Textarea
                  placeholder='e.g. {"correct_answer": "42"} or [{"q":1,"a":"B"}]'
                  value={answerKey}
                  onChange={(e) => setAnswerKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <Button type="submit" className="w-full font-pixel text-[8px]" disabled={createAssignment.isPending || !courseId}>
                {createAssignment.isPending ? "CREATING..." : "CREATE ASSIGNMENT"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 && (
        <Card className="border-2 border-dashed border-warning/50">
          <CardContent className="py-4 text-center text-sm text-warning">
            Create a course first before adding assignments.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : assignments.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center text-muted-foreground">No assignments yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a, i) => {
            const meta = TYPE_META[a.type] || TYPE_META.free_text;
            const Icon = meta.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-2 border-border">
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={`p-2 rounded ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-[9px] text-foreground truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[7px]">{meta.label}</Badge>
                        <span className="text-xs text-muted-foreground">{(a as any).courses?.title}</span>
                        {!a.is_mandatory && <Badge variant="secondary" className="text-[7px]">Optional</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAssignment.mutate(a.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

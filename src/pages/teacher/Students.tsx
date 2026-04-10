import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, Users, Trash2 } from "lucide-react";

export default function TeacherStudents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const { data: courses = [] } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title").eq("teacher_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["teacher-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, courses(title), profiles:student_id(display_name, user_id)")
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrollStudent = useMutation({
    mutationFn: async () => {
      // Find student by email via profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", studentEmail)
        .maybeSingle();

      // If not found by display_name, the teacher needs to use exact user ID or we search differently
      // For now, let's try to find by looking up auth - we'll use display_name as identifier
      if (!profile) {
        throw new Error("Student not found. Make sure they've signed up and use their display name.");
      }

      const { error } = await supabase.from("course_enrollments").insert({
        course_id: courseId,
        student_id: profile.user_id,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Student already enrolled in this course");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Student enrolled!");
      setOpen(false);
      setStudentEmail("");
      setCourseId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const unenroll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_enrollments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Student removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Group by course
  const grouped = enrollments.reduce((acc: Record<string, any[]>, e) => {
    const courseTitle = (e as any).courses?.title || "Unknown";
    if (!acc[courseTitle]) acc[courseTitle] = [];
    acc[courseTitle].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> STUDENTS
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-pixel text-[8px] gap-1" disabled={courses.length === 0}>
              <UserPlus className="h-3 w-3" /> ENROLL STUDENT
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-pixel text-[10px]">ENROLL STUDENT</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); enrollStudent.mutate(); }} className="space-y-3">
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Student display name"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Enter the student's display name exactly as they registered.</p>
              <Button type="submit" className="w-full font-pixel text-[8px]" disabled={enrollStudent.isPending || !courseId}>
                {enrollStudent.isPending ? "ENROLLING..." : "ENROLL"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center text-muted-foreground">No students enrolled yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([courseTitle, students]) => (
            <div key={courseTitle} className="space-y-2">
              <h3 className="font-pixel text-[8px] text-muted-foreground">{courseTitle}</h3>
              {students.map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="border border-border">
                    <CardContent className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        <span className="text-sm text-foreground">{s.profiles?.display_name || "Unknown"}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => unenroll.mutate(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

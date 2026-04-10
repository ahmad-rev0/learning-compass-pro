import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Users, BookOpen, Trash2 } from "lucide-react";

export default function TeacherCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, course_enrollments(count)")
        .eq("teacher_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        teacher_id: user!.id,
        title,
        description: description || null,
        subject: subject || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Course created!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setSubject("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Course deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> MY COURSES
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-pixel text-[8px] gap-1">
              <Plus className="h-3 w-3" /> NEW COURSE
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-pixel text-[10px]">CREATE COURSE</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createCourse.mutate(); }}
              className="space-y-3"
            >
              <Input placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input placeholder="Subject (e.g. Mathematics, Python)" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button type="submit" className="w-full font-pixel text-[8px]" disabled={createCourse.isPending}>
                {createCourse.isPending ? "CREATING..." : "CREATE COURSE"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : courses.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No courses yet. Create your first course!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-2 border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-pixel text-[9px] text-foreground">{course.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteCourse.mutate(course.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.subject && <Badge variant="outline" className="text-[8px]">{course.subject}</Badge>}
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Users className="h-3 w-3" />
                    <span>{(course.course_enrollments as any)?.[0]?.count || 0} students</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

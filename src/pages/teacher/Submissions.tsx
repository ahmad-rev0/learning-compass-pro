import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  graded: "bg-success/10 text-success border-success/30",
  reviewed: "bg-primary/10 text-primary border-primary/30",
};

export default function TeacherSubmissions() {
  const { user } = useAuth();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["teacher-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, assignments(title, type), profiles:student_id(display_name)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Inbox className="h-4 w-4" /> SUBMISSIONS
      </h2>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : submissions.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="py-8 text-center text-muted-foreground">No submissions yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {submissions.map((s: any, i: number) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="border-2 border-border">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[9px] text-foreground truncate">
                      {s.profiles?.display_name || "Unknown"} → {s.assignments?.title || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[7px]">{s.assignments?.type}</Badge>
                      <Badge className={`text-[7px] ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                      {s.score !== null && (
                        <span className="text-xs text-muted-foreground">Score: {s.score}</span>
                      )}
                    </div>
                    {s.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(s.submitted_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

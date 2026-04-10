import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Eye, Zap, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const STATE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  normal: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "text-green-400 border-green-500/30 bg-green-500/10", label: "HEALTHY" },
  micro_stuck: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "MICRO-STUCK" },
  momentum_dip: { icon: <TrendingDown className="h-3.5 w-3.5" />, color: "text-orange-400 border-orange-500/30 bg-orange-500/10", label: "MOMENTUM DIP" },
  double_trouble: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-400 border-red-500/30 bg-red-500/10", label: "DOUBLE TROUBLE" },
  emergency_recovery: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-400 border-red-500/30 bg-red-500/10", label: "EMERGENCY" },
  re_engagement: { icon: <Zap className="h-3.5 w-3.5" />, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", label: "RE-ENGAGE" },
  skill_support: { icon: <Brain className="h-3.5 w-3.5" />, color: "text-purple-400 border-purple-500/30 bg-purple-500/10", label: "SKILL SUPPORT" },
  quest_focus: { icon: <Eye className="h-3.5 w-3.5" />, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", label: "QUEST FOCUS" },
  momentum_boost: { icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-green-400 border-green-500/30 bg-green-500/10", label: "BOOSTING" },
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);

  const { data: logs = [] } = useQuery({
    queryKey: ["agent-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("agent-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_logs", filter: `user_id=eq.${user.id}` },
        (payload) => setRealtimeLogs((prev) => [payload.new as any, ...prev].slice(0, 5))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const allLogs = [...realtimeLogs, ...logs].reduce((acc: any[], log) => {
    if (!acc.find((l) => l.id === log.id)) acc.push(log);
    return acc;
  }, []).slice(0, 15);

  const latestState = allLogs[0]?.detected_state || "normal";
  const cfg = STATE_CONFIG[latestState] || STATE_CONFIG.normal;

  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
        <Brain className="h-4 w-4" /> AGENT BRAIN
      </h2>

      {/* Current state */}
      <Card className={`border-2 ${cfg.color}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cfg.color.split(" ")[0]}
            >
              <Brain className="h-8 w-8" />
            </motion.div>
            <div>
              <p className="font-pixel text-[10px] text-foreground">AGENT STATE</p>
              <Badge variant="outline" className={cfg.color}>
                {cfg.icon} <span className="ml-1">{cfg.label}</span>
              </Badge>
              {allLogs[0] && (
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {(Number(allLogs[0].confidence) * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision log */}
      <div className="space-y-2">
        <p className="font-pixel text-[9px] text-accent">🧠 AGENT DECISIONS</p>
        <AnimatePresence>
          {allLogs.map((log, i) => {
            const logCfg = STATE_CONFIG[log.detected_state] || STATE_CONFIG.normal;
            const patterns = (log.patterns_found as any[]) || [];
            const metrics = (log.metrics_snapshot as any) || {};
            const time = new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

            return (
              <motion.div
                key={log.id}
                initial={i === 0 && realtimeLogs.includes(log) ? { opacity: 0, x: -30, scale: 0.95 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-border">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${logCfg.color} text-[8px]`}>
                          {logCfg.icon} <span className="ml-0.5">{logCfg.label}</span>
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{time}</span>
                      </div>
                      <Badge variant="outline" className="text-[8px]">
                        {log.trigger_source}
                      </Badge>
                    </div>

                    <p className="font-pixel text-[9px] text-foreground">{log.action_taken}</p>
                    <p className="text-xs text-muted-foreground italic">{log.reasoning}</p>

                    {patterns.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[8px] text-muted-foreground">Patterns:</span>
                        {patterns.map((p, j) => (
                          <Badge key={j} variant="outline" className="text-[7px] bg-muted/30">
                            {typeof p === "string" ? p.slice(0, 30) : JSON.stringify(p).slice(0, 30)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {Object.keys(metrics).length > 0 && (
                      <div className="flex gap-3 text-[8px] text-muted-foreground">
                        {metrics.momentum !== undefined && <span>Momentum: {Number(metrics.momentum).toFixed(0)}%</span>}
                        {metrics.recentAvg !== undefined && <span>Avg: {Number(metrics.recentAvg).toFixed(0)}%</span>}
                        {metrics.avgScore !== undefined && <span>Avg: {Number(metrics.avgScore).toFixed(0)}%</span>}
                        {metrics.streak !== undefined && <span>Streak: {metrics.streak}d</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {allLogs.length === 0 && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-6 text-center">
              <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No agent decisions yet. Submit work to activate the agent.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

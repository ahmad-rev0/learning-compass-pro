import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentDecision } from "@/lib/mockData";

interface AgentDecisionLogProps {
  decisions: AgentDecision[];
}

const stateColors: Record<string, string> = {
  micro_stuck: "border-l-warning bg-warning/5",
  momentum_dip: "border-l-accent bg-accent/5",
  double_trouble: "border-l-destructive bg-destructive/5",
};

const stateLabels: Record<string, string> = {
  micro_stuck: "MICRO-STUCK",
  momentum_dip: "MOMENTUM DIP",
  double_trouble: "DOUBLE TROUBLE",
};

export function AgentDecisionLog({ decisions }: AgentDecisionLogProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>🤖</span> Agent Decisions
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Autonomous</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-6 pb-4">
          {decisions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Agent monitoring… No interventions yet.</p>
          )}
          <AnimatePresence mode="popLayout">
            {decisions.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                layout
                className={`mb-3 rounded-lg border border-border/50 border-l-4 p-4 ${stateColors[d.state] || ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{stateLabels[d.state]}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {/* Reasoning */}
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reasoning</p>
                    <p className="mt-0.5 text-xs text-foreground leading-relaxed">{d.reasoning}</p>
                  </div>

                  {/* Action taken */}
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Action</p>
                    <p className="mt-0.5 text-xs text-primary leading-relaxed">{d.action}</p>
                  </div>

                  {/* Exa query */}
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                    <span className="text-[10px] text-muted-foreground">Exa Query:</span>
                    <code className="text-[11px] font-mono text-accent">{d.exaQuery}</code>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Confidence:</span>
                    <div className="h-1.5 w-20 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${d.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-foreground">{(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

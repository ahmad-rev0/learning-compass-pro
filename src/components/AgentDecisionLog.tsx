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
    <Card className="flex flex-col pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center gap-2">
          🤖 AGENT LOG
          <Badge variant="outline" className="font-pixel text-[7px] text-muted-foreground">AUTO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {decisions.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Agent monitoring... No interventions yet. ▌
            </p>
          )}
          <AnimatePresence mode="popLayout">
            {decisions.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                layout
                className={`mb-3 border-2 border-border border-l-4 p-3 ${stateColors[d.state] || ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-pixel text-[7px]">{stateLabels[d.state]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  <div>
                    <p className="font-pixel text-[7px] text-muted-foreground">REASONING</p>
                    <p className="mt-0.5 text-sm text-foreground">{d.reasoning}</p>
                  </div>

                  <div>
                    <p className="font-pixel text-[7px] text-muted-foreground">ACTION</p>
                    <p className="mt-0.5 text-sm text-primary">{d.action}</p>
                  </div>

                  <div className="flex items-center gap-2 border border-border bg-muted/50 px-2 py-1.5">
                    <span className="text-xs text-muted-foreground">Exa:</span>
                    <span className="text-sm text-accent">{d.exaQuery}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="hp-bar flex-1">
                      <div
                        className="hp-bar-fill hp-green"
                        style={{ width: `${d.confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-pixel text-[8px] text-foreground">{(d.confidence * 100).toFixed(0)}%</span>
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

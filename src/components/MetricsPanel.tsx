import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metrics } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricsPanelProps {
  metrics: Metrics | null;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) return null;

  const errorDanger = metrics.error_count_last_10 >= 3;
  const quizDanger = metrics.avg_quiz_score_last_3 < 70;
  const studyDanger = metrics.study_time_trend <= -15;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📊</span> Live Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricGauge
          label="Error Rate"
          value={metrics.error_count_last_10}
          max={10}
          unit="errors"
          danger={errorDanger}
          icon="🐛"
        />
        <MetricGauge
          label="Quiz Average"
          value={metrics.avg_quiz_score_last_3}
          max={100}
          unit="%"
          danger={quizDanger}
          icon="📝"
          invert
        />
        <MetricGauge
          label="Study Trend"
          value={Math.max(0, metrics.study_time_trend + 30)}
          max={60}
          unit={`${metrics.study_time_trend > 0 ? "+" : ""}${metrics.study_time_trend} min`}
          danger={studyDanger}
          icon="⏱"
          invert
        />

        {metrics.last_error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-destructive">Latest Error</p>
            <p className="mt-1 font-mono text-xs text-foreground">{metrics.last_error.type}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{metrics.last_error.msg}</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricGauge({ label, value, max, unit, danger, icon, invert }: {
  label: string; value: number; max: number; unit: string; danger: boolean; icon: string; invert?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const displayDanger = invert ? !danger : danger;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon} {label}
        </span>
        <span className={cn("text-xs font-mono font-bold", danger ? "text-destructive" : "text-foreground")}>
          {typeof value === "number" && unit !== "%" && !unit.includes("min") ? value : ""}
          {unit.includes("min") || unit === "%" ? `${value.toFixed(unit === "%" ? 1 : 0)}` : ""}
          {unit !== "%" && !unit.includes("min") && !unit.includes("+") && !unit.includes("-") ? ` ${unit}` : ""}
          {(unit.includes("min") || unit.includes("+") || unit.includes("-")) ? ` ${unit.split(" ").pop()}` : ""}
          {unit === "%" ? "%" : ""}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full transition-colors", displayDanger ? "bg-destructive" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

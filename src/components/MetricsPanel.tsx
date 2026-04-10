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
    <Card className="pixel-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-pixel text-[9px] flex items-center gap-2">
          📊 LIVE METRICS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PixelGauge
          label="BUG RATE"
          value={metrics.error_count_last_10}
          max={10}
          display={`${metrics.error_count_last_10} bugs`}
          danger={errorDanger}
          icon="🐛"
        />
        <PixelGauge
          label="QUIZ AVG"
          value={metrics.avg_quiz_score_last_3}
          max={100}
          display={`${metrics.avg_quiz_score_last_3.toFixed(0)}%`}
          danger={quizDanger}
          icon="📝"
          invert
        />
        <PixelGauge
          label="STUDY TREND"
          value={Math.max(0, metrics.study_time_trend + 30)}
          max={60}
          display={`${metrics.study_time_trend > 0 ? "+" : ""}${metrics.study_time_trend} min`}
          danger={studyDanger}
          icon="⏱"
          invert
        />

        {metrics.last_error && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="mt-3 border-2 border-destructive/30 bg-destructive/10 p-3"
          >
            <p className="font-pixel text-[7px] text-destructive">!! LATEST ERROR</p>
            <p className="mt-1 text-base text-foreground">{metrics.last_error.type}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{metrics.last_error.msg}</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function PixelGauge({ label, value, max, display, danger, icon, invert }: {
  label: string; value: number; max: number; display: string; danger: boolean; icon: string; invert?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const showDanger = invert ? !danger : danger;
  const barColor = showDanger ? "hp-red" : "hp-green";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {icon} {label}
        </span>
        <motion.span
          key={display}
          initial={danger ? { x: [-2, 2, -2, 0] } : {}}
          animate={danger ? { x: [-1, 1, -1, 0] } : {}}
          transition={{ duration: 0.3 }}
          className={cn("font-pixel text-[9px]", danger ? "text-destructive" : "text-foreground")}
        >
          {display}
        </motion.span>
      </div>
      <div className="hp-bar">
        <motion.div
          className={`hp-bar-fill ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

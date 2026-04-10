import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metrics } from "@/lib/api";

interface MetricsPanelProps {
  metrics: Metrics | null;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">📊 Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MetricRow label="Errors (last 10)" value={metrics.error_count_last_10} warn={metrics.error_count_last_10 >= 3} />
        <MetricRow label="Avg Quiz Score" value={metrics.avg_quiz_score_last_3.toFixed(1)} warn={metrics.avg_quiz_score_last_3 < 70} />
        <MetricRow label="Study Trend" value={`${metrics.study_time_trend > 0 ? "+" : ""}${metrics.study_time_trend} min`} warn={metrics.study_time_trend <= -15} />
        <MetricRow label="Total Ticks" value={metrics.total_ticks} />
        {metrics.last_error && (
          <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 p-2">
            <p className="font-mono text-xs text-destructive">{metrics.last_error.type}: {metrics.last_error.msg}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${warn ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

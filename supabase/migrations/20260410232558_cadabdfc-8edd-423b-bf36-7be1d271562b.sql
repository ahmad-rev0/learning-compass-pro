
-- Agent decision log table
CREATE TABLE public.agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  detected_state TEXT NOT NULL DEFAULT 'normal',
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  patterns_found JSONB DEFAULT '[]'::jsonb,
  action_taken TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  trigger_source TEXT NOT NULL DEFAULT 'submission',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agent logs"
  ON public.agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers view student agent logs"
  ON public.agent_logs FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "System inserts agent logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (true);

-- Study plans table
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_level TEXT NOT NULL DEFAULT 'intermediate',
  status TEXT NOT NULL DEFAULT 'active',
  progress_pct INTEGER NOT NULL DEFAULT 0,
  agent_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own study plans"
  ON public.study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own study plans"
  ON public.study_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts study plans"
  ON public.study_plans FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for agent logs so the dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;

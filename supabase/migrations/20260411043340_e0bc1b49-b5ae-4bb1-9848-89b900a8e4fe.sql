
CREATE TABLE public.self_study_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mcq',
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  student_answer TEXT,
  ai_feedback JSONB,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  generated_by TEXT NOT NULL DEFAULT 'request_form',
  xp_reward INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.self_study_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own self-study assignments"
ON public.self_study_assignments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students create own self-study assignments"
ON public.self_study_assignments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students update own self-study assignments"
ON public.self_study_assignments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System inserts self-study assignments"
ON public.self_study_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Teachers view all self-study assignments"
ON public.self_study_assignments FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE TRIGGER update_self_study_assignments_updated_at
BEFORE UPDATE ON public.self_study_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

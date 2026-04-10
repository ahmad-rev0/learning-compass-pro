
CREATE TABLE public.generated_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'skill',
  difficulty TEXT NOT NULL DEFAULT 'bronze',
  criteria_met TEXT,
  resource_url TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 30,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  generated_from UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own achievements"
  ON public.generated_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users claim own achievements"
  ON public.generated_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts achievements"
  ON public.generated_achievements FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_generated_achievements_updated_at
  BEFORE UPDATE ON public.generated_achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

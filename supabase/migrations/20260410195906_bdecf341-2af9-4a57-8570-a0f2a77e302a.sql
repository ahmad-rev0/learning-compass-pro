
-- Quests table for AI-generated personalized challenges
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'recovery',
  xp_reward INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'active',
  generated_from UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own quests" ON public.quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students update own quests" ON public.quests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System inserts quests" ON public.quests
  FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Badge unlocks table
CREATE TABLE public.badge_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.badge_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own badges" ON public.badge_unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System inserts badges" ON public.badge_unlocks
  FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.badge_unlocks;

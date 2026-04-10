
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS resource_url text;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS error_pattern text;

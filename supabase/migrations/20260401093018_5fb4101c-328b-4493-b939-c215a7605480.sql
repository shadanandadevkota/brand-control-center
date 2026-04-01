ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Mark all existing sections as default (pre-seeded)
UPDATE public.page_sections SET is_default = true WHERE is_default = false;
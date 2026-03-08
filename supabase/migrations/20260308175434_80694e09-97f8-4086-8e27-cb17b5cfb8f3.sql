
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Admin roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Page content table
CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'gallery', 'vimeo_url')),
  text_value TEXT,
  media_url TEXT,
  media_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_id)
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can read page content (for frontend)
CREATE POLICY "Anyone can read page sections"
ON public.page_sections FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert page sections"
ON public.page_sections FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page sections"
ON public.page_sections FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page sections"
ON public.page_sections FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_page_sections_updated_at
BEFORE UPDATE ON public.page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Media library table
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size BIGINT,
  mime_type TEXT,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media files"
ON public.media_files FOR SELECT USING (true);

CREATE POLICY "Admins can insert media files"
ON public.media_files FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media files"
ON public.media_files FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media files"
ON public.media_files FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_media_files_updated_at
BEFORE UPDATE ON public.media_files
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));


-- Wedding Projects table (for photo stories and film projects)
CREATE TABLE public.wedding_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  couple_name text NOT NULL,
  location text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  tagline text DEFAULT '',
  cover_image text DEFAULT '',
  date_text text DEFAULT '',
  project_type text NOT NULL DEFAULT 'photo', -- 'photo' or 'film'
  duration text DEFAULT '',
  video_url text DEFAULT '',
  thumbnail text DEFAULT '',
  behind_the_scenes text DEFAULT '',
  images text[] DEFAULT '{}',
  has_blog boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wedding Blog Posts table
CREATE TABLE public.wedding_blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  couple_name text NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  author text DEFAULT 'The TMF Team',
  date_text text DEFAULT '',
  read_time text DEFAULT '',
  cover_image text DEFAULT '',
  content jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wedding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view wedding projects" ON public.wedding_projects FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view wedding blog posts" ON public.wedding_blog_posts FOR SELECT TO public USING (true);

-- Admin write policies for wedding_projects
CREATE POLICY "Admins can insert wedding projects" ON public.wedding_projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wedding projects" ON public.wedding_projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete wedding projects" ON public.wedding_projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for wedding_blog_posts
CREATE POLICY "Admins can insert wedding blog posts" ON public.wedding_blog_posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wedding blog posts" ON public.wedding_blog_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete wedding blog posts" ON public.wedding_blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_wedding_projects_updated_at BEFORE UPDATE ON public.wedding_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wedding_blog_posts_updated_at BEFORE UPDATE ON public.wedding_blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

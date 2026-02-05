-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  difficulty difficulty_level NOT NULL DEFAULT 'iniciante',
  order_index INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add course_id to modules table
ALTER TABLE public.modules 
ADD COLUMN course_id UUID REFERENCES public.courses(id);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses are viewable by everyone
CREATE POLICY "Courses are viewable by everyone"
ON public.courses
FOR SELECT
USING (is_active = true);

-- Admins can manage courses
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the first course (Introdução às redes de computadores)
INSERT INTO public.courses (id, title, description, icon, difficulty, order_index, xp_reward)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Introdução às Redes de Computadores',
  'Aprenda os fundamentos essenciais de redes de computadores, desde conceitos básicos até diagnósticos avançados.',
  'Network',
  'iniciante',
  0,
  6450
);

-- Link all existing modules to this course
UPDATE public.modules
SET course_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE course_id IS NULL;

-- Adicionar colunas de conteúdo programático à tabela courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS syllabus text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS curriculum text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS bibliography text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS pdf_url text;

-- Criar bucket de storage para PDFs de cursos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: admins podem fazer upload em seu próprio path
CREATE POLICY "Admins can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can update their course files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-files'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can delete their course files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Course files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-files');

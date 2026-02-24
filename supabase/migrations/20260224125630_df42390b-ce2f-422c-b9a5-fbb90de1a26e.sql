
-- Certificate templates (admin customization)
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Certificado de Conclusão',
  subtitle TEXT DEFAULT 'Certificamos que',
  footer_text TEXT DEFAULT 'Este certificado foi emitido digitalmente e pode ser verificado online.',
  signature_name TEXT,
  signature_title TEXT,
  logo_url TEXT,
  background_color TEXT DEFAULT '#0a1628',
  primary_color TEXT DEFAULT '#2dd4bf',
  accent_color TEXT DEFAULT '#22c55e',
  font_family TEXT DEFAULT 'Space Grotesk',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, course_id)
);

-- Issued certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  issued_by UUID NOT NULL,
  certificate_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS for certificate_templates
CREATE POLICY "Admins can manage own templates"
ON public.certificate_templates FOR ALL
USING (owner_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Masters can view their admins templates"
ON public.certificate_templates FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), owner_id));

-- RLS for certificates
CREATE POLICY "Admins can manage certificates they issued"
ON public.certificates FOR ALL
USING (issued_by = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Masters can view their admins certificates"
ON public.certificates FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role) AND is_master_of_admin(auth.uid(), issued_by));

-- Triggers for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX idx_certificates_code ON public.certificates(certificate_code);
CREATE INDEX idx_certificate_templates_owner ON public.certificate_templates(owner_id);

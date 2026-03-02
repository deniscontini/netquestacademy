
-- Add signature_image_url to profiles table for admin/instructor signature uploads
ALTER TABLE public.profiles ADD COLUMN signature_image_url text;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Allow authenticated users to upload their own signature
CREATE POLICY "Users can upload their own signature"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own signature
CREATE POLICY "Users can update their own signature"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own signature
CREATE POLICY "Users can delete their own signature"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for signatures (they appear on certificates)
CREATE POLICY "Signatures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Create edge function for public certificate validation (no auth needed)
-- We need a DB function that validates a certificate by code publicly
CREATE OR REPLACE FUNCTION public.validate_certificate_by_code(p_code text)
RETURNS TABLE(
  certificate_code text,
  student_name text,
  course_title text,
  completion_date timestamptz,
  issued_at timestamptz,
  issuer_name text,
  issuer_signature_title text,
  workload_hours integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.certificate_code,
    c.student_name,
    c.course_title,
    c.completion_date,
    c.issued_at,
    COALESCE(p.full_name, p.username, 'Instrutor') as issuer_name,
    COALESCE(ct.signature_title, 'Professor / Instrutor') as issuer_signature_title,
    COALESCE(co.workload_hours, 0) as workload_hours
  FROM certificates c
  LEFT JOIN profiles p ON p.user_id = c.issued_by
  LEFT JOIN certificate_templates ct ON ct.id = c.template_id
  LEFT JOIN courses co ON co.id = c.course_id
  WHERE c.certificate_code = p_code;
END;
$$;

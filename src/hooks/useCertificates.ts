import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CertificateTemplate {
  id: string;
  owner_id: string;
  course_id: string | null;
  title: string;
  subtitle: string | null;
  footer_text: string | null;
  signature_name: string | null;
  signature_title: string | null;
  logo_url: string | null;
  background_color: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  template_id: string | null;
  issued_by: string;
  certificate_code: string;
  student_name: string;
  course_title: string;
  completion_date: string;
  pdf_url: string | null;
  issued_at: string;
  created_at: string;
}

// Admin: fetch templates
export const useCertificateTemplates = () => {
  return useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });
};

// Admin: save/update template
export const useSaveCertificateTemplate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<CertificateTemplate> & { course_id?: string | null }) => {
      if (!user) throw new Error("Não autenticado");

      const payload = {
        ...template,
        owner_id: user.id,
      };

      if (template.id) {
        const { error } = await supabase
          .from("certificate_templates")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("certificate_templates")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      toast.success("Template salvo com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao salvar template: ${e.message}`),
  });
};

// Admin: delete template
export const useDeleteCertificateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      toast.success("Template excluído!");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
};

// Admin: fetch issued certificates
export const useAdminCertificates = () => {
  return useQuery({
    queryKey: ["admin", "certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as Certificate[];
    },
  });
};

// Admin: issue certificate
export const useIssueCertificate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      courseId: string;
      studentName: string;
      courseTitle: string;
      templateId?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("certificates").insert({
        user_id: data.userId,
        course_id: data.courseId,
        student_name: data.studentName,
        course_title: data.courseTitle,
        template_id: data.templateId || null,
        issued_by: user.id,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      toast.success("Certificado emitido com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao emitir certificado: ${e.message}`),
  });
};

// Student: fetch my certificates
export const useMyCertificates = () => {
  return useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as Certificate[];
    },
  });
};

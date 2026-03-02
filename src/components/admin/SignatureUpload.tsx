import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, PenLine } from "lucide-react";

interface SignatureUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string | null) => void;
}

const SignatureUpload = ({ currentUrl, onUploaded }: SignatureUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.includes("png")) {
      toast.error("Apenas arquivos PNG são permitidos.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/signature.png`;

      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ signature_image_url: publicUrl } as any)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      onUploaded(publicUrl);
      toast.success("Assinatura enviada com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao enviar assinatura: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await supabase.storage.from("signatures").remove([`${user.id}/signature.png`]);
      await supabase
        .from("profiles")
        .update({ signature_image_url: null } as any)
        .eq("user_id", user.id);
      onUploaded(null);
      toast.success("Assinatura removida.");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <PenLine className="w-4 h-4" />
        Imagem da Assinatura (PNG)
      </Label>
      <p className="text-xs text-muted-foreground">
        Envie uma imagem PNG da sua assinatura. Ela será exibida nos certificados emitidos.
        Recomendamos fundo transparente, resolução mínima de 400x150px.
      </p>

      {currentUrl && (
        <div className="border border-border rounded-lg p-4 bg-secondary/30">
          <img
            src={currentUrl}
            alt="Assinatura"
            className="max-h-20 mx-auto"
            style={{ imageRendering: "auto" }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {currentUrl ? "Alterar" : "Enviar"} Assinatura
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="gap-2 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Remover
          </Button>
        )}
      </div>
    </div>
  );
};

export default SignatureUpload;

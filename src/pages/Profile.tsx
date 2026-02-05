import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Trophy, 
  Flame, 
  Calendar, 
  Save, 
  Camera,
  Loader2,
  Star,
  Target
} from "lucide-react";
import { z } from "zod";

// Schema de validação
const profileSchema = z.object({
  username: z.string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Username pode conter apenas letras, números e underscores")
    .optional()
    .or(z.literal("")),
  full_name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string()
    .url("URL do avatar inválida")
    .optional()
    .or(z.literal("")),
});

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Popula o form com dados existentes
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  // Detecta mudanças
  useEffect(() => {
    if (profile) {
      const changed = 
        formData.username !== (profile.username || "") ||
        formData.full_name !== (profile.full_name || "") ||
        formData.avatar_url !== (profile.avatar_url || "");
      setHasChanges(changed);
    }
  }, [formData, profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa o erro do campo quando o usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Valida os dados
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: formData.username || null,
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
      });
      toast.success("Perfil atualizado com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        setErrors({ username: "Este username já está em uso" });
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      return formData.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e acompanhe seu progresso.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Coluna Principal - Formulário */}
            <div className="md:col-span-2 space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações de perfil visíveis para outros usuários.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Preview */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-2 border-border">
                        <AvatarImage src={formData.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xl">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Label htmlFor="avatar_url" className="flex items-center gap-2 mb-2">
                          <Camera className="w-4 h-4" />
                          URL do Avatar
                        </Label>
                        <Input
                          id="avatar_url"
                          type="url"
                          placeholder="https://exemplo.com/sua-foto.jpg"
                          value={formData.avatar_url}
                          onChange={e => handleInputChange("avatar_url", e.target.value)}
                          className={errors.avatar_url ? "border-destructive" : ""}
                        />
                        {errors.avatar_url && (
                          <p className="text-sm text-destructive mt-1">{errors.avatar_url}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Cole a URL de uma imagem de perfil (JPG, PNG)
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Nome Completo */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.full_name}
                        onChange={e => handleInputChange("full_name", e.target.value)}
                        className={errors.full_name ? "border-destructive" : ""}
                      />
                      {errors.full_name && (
                        <p className="text-sm text-destructive">{errors.full_name}</p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="seu_username"
                        value={formData.username}
                        onChange={e => handleInputChange("username", e.target.value.toLowerCase())}
                        className={errors.username ? "border-destructive" : ""}
                      />
                      {errors.username && (
                        <p className="text-sm text-destructive">{errors.username}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Apenas letras, números e underscores. Visível no ranking.
                      </p>
                    </div>

                    {/* Email (somente leitura) */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        O e-mail não pode ser alterado.
                      </p>
                    </div>

                    {/* Botão de Salvar */}
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!hasChanges || updateProfile.isPending}
                        className="gap-2"
                      >
                        {updateProfile.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Lateral - Estatísticas */}
            <div className="space-y-6">
              {/* Card de Nível */}
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Nível {profile?.level || 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-primary-foreground">
                        {profile?.level || 1}
                      </span>
                    </div>
                    <Badge variant="xp" className="text-lg px-4 py-1">
                      {profile?.xp || 0} XP
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="w-4 h-4" />
                      <span>XP Total</span>
                    </div>
                    <span className="font-semibold">{profile?.xp || 0}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>Sequência</span>
                    </div>
                    <span className="font-semibold">{profile?.streak_days || 0} dias</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Membro desde</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatDate(profile?.created_at || null)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Última atividade</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatDate(profile?.last_activity_at || null)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/ranking")}
                  >
                    <Trophy className="w-4 h-4" />
                    Ver Ranking
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/dashboard")}
                  >
                    <Target className="w-4 h-4" />
                    Continuar Estudando
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;

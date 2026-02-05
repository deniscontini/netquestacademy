import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBatchCreateUsers } from "@/hooks/useUserManagement";
import { useAssignModules } from "@/hooks/useModuleAssignments";
import { useModules } from "@/hooks/useModules";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, AlertCircle, CheckCircle2, Download, Upload, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BatchAddUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchAddUsersDialog = ({ open, onOpenChange }: BatchAddUsersDialogProps) => {
  const [csvData, setCsvData] = useState("");
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string; coursesAssigned?: number }[] | null>(null);
  const batchCreate = useBatchCreateUsers();
  const assignModules = useAssignModules();
  const { data: modules } = useModules();
  const { toast } = useToast();

  // Generate CSV template dynamically with available courses
  const generateCsvTemplate = () => {
    const courseNames = modules?.map((m) => m.title).join("; ") || "";
    const header = `email,senha,nome,username,role,cursos`;
    const example1 = `joao@exemplo.com,senha123,João Silva,joaosilva,user,"Curso 1; Curso 2"`;
    const example2 = `maria@exemplo.com,senha456,Maria Santos,mariasantos,admin,`;
    const example3 = `pedro@exemplo.com,senha789,Pedro Costa,pedrocosta,user,"${modules?.[0]?.title || "Nome do Curso"}"`;
    
    return `${header}\n${example1}\n${example2}\n${example3}\n\n# Cursos disponíveis: ${courseNames || "Nenhum curso cadastrado"}`;
  };

  const parseCSV = (data: string) => {
    const lines = data.trim().split("\n").filter((line) => !line.startsWith("#"));
    const users: { 
      email: string; 
      password: string; 
      fullName?: string; 
      username?: string; 
      role?: "admin" | "user";
      courses?: string[];
    }[] = [];

    // Skip header line if present
    const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Handle quoted fields (for courses with semicolons)
      const fields: string[] = [];
      let currentField = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim());
      
      const [email, password, fullName, username, role, coursesStr] = fields;
      
      if (email && password) {
        // Parse courses - split by semicolon
        const courses = coursesStr 
          ? coursesStr.split(";").map((c) => c.trim()).filter(Boolean)
          : [];
        
        users.push({
          email,
          password,
          fullName: fullName || undefined,
          username: username || undefined,
          role: role === "admin" ? "admin" : "user",
          courses,
        });
      }
    }

    return users;
  };

  const handleDownloadTemplate = () => {
    const template = generateCsvTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_usuarios.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado",
      description: "O modelo CSV foi baixado com os cursos disponíveis",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo CSV",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      toast({
        title: "Arquivo carregado",
        description: `${file.name} foi carregado com sucesso`,
      });
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  const handleSubmit = async () => {
    const users = parseCSV(csvData);

    if (users.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum usuário válido encontrado. Verifique o formato.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create users first
      const usersToCreate = users.map(({ courses, ...rest }) => rest);
      const result = await batchCreate.mutateAsync(usersToCreate);
      
      // Build a map of course names to IDs
      const courseNameToId = new Map(
        modules?.map((m) => [m.title.toLowerCase(), m.id]) || []
      );

      // Assign courses to successfully created users
      const resultsWithCourses = await Promise.all(
        result.results.map(async (userResult, index) => {
          if (!userResult.success) {
            return userResult;
          }

          const userCourses = users[index]?.courses || [];
          if (userCourses.length === 0) {
            return { ...userResult, coursesAssigned: 0 };
          }

          // Find course IDs from names
          const courseIds = userCourses
            .map((name) => courseNameToId.get(name.toLowerCase()))
            .filter((id): id is string => !!id);

          if (courseIds.length === 0) {
            return { ...userResult, coursesAssigned: 0 };
          }

          // We need to get the user ID - fetch by email
          try {
            const { data: profiles } = await (await import("@/integrations/supabase/client")).supabase
              .from("profiles")
              .select("user_id")
              .ilike("username", users[index].email.split("@")[0])
              .limit(1);

            if (profiles && profiles[0]) {
              await assignModules.mutateAsync({
                userId: profiles[0].user_id,
                moduleIds: courseIds,
              });
              return { ...userResult, coursesAssigned: courseIds.length };
            }
          } catch (e) {
            console.error("Error assigning courses:", e);
          }

          return { ...userResult, coursesAssigned: 0 };
        })
      );

      setResults(resultsWithCourses);
      
      const successCount = resultsWithCourses.filter((r) => r.success).length;
      const failCount = resultsWithCourses.filter((r) => !r.success).length;
      const coursesAssigned = resultsWithCourses.reduce((acc, r) => acc + (r.coursesAssigned || 0), 0);

      toast({
        title: "Operação concluída",
        description: `${successCount} usuário(s) criado(s), ${failCount} falha(s)${coursesAssigned > 0 ? `, ${coursesAssigned} curso(s) atribuído(s)` : ""}`,
        variant: failCount > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar os usuários",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCsvData("");
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Adicionar Usuários em Lote
          </DialogTitle>
          <DialogDescription>
            Cole os dados dos usuários no formato CSV (um por linha)
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <>
            <div className="space-y-4">
              {/* Download template button */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
              </div>

              <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste">Colar Dados</TabsTrigger>
                  <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="space-y-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label>Formato: email,senha,nome,username,role,cursos</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Apenas email e senha são obrigatórios. Role pode ser "user" ou "admin".
                        Cursos devem ser separados por ponto e vírgula (;).
                      </p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Info className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Cursos disponíveis:</p>
                          <p className="text-xs">
                            {modules?.map((m) => m.title).join(", ") || "Nenhum curso cadastrado"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Textarea
                    placeholder={`joao@exemplo.com,senha123,João Silva,joaosilva,user,"Curso 1; Curso 2"
maria@exemplo.com,senha456,Maria Santos,mariasantos,admin,
pedro@exemplo.com,senha789,Pedro Costa,pedrocosta,user,"Nome do Curso"`}
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">Clique para selecionar</span>
                      <span className="text-muted-foreground"> ou arraste o arquivo CSV</span>
                    </Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Somente arquivos .csv são aceitos
                    </p>
                  </div>

                  {csvData && (
                    <div className="space-y-2">
                      <Label>Pré-visualização dos dados</Label>
                      <Textarea
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={batchCreate.isPending || !csvData.trim()}>
                {batchCreate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Usuários
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      result.success ? "bg-primary/10" : "bg-destructive/10"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="font-mono text-sm flex-1">{result.email}</span>
                    {result.success && result.coursesAssigned !== undefined && result.coursesAssigned > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {result.coursesAssigned} curso(s)
                      </span>
                    )}
                    {result.error && (
                      <span className="text-xs text-muted-foreground">- {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchAddUsersDialog;

import { useState } from "react";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchAddUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchAddUsersDialog = ({ open, onOpenChange }: BatchAddUsersDialogProps) => {
  const [csvData, setCsvData] = useState("");
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[] | null>(null);
  const batchCreate = useBatchCreateUsers();
  const { toast } = useToast();

  const parseCSV = (data: string) => {
    const lines = data.trim().split("\n");
    const users: { email: string; password: string; fullName?: string; username?: string; role?: "admin" | "user" }[] = [];

    for (const line of lines) {
      const [email, password, fullName, username, role] = line.split(",").map((s) => s.trim());
      if (email && password) {
        users.push({
          email,
          password,
          fullName: fullName || undefined,
          username: username || undefined,
          role: role === "admin" ? "admin" : "user",
        });
      }
    }

    return users;
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
      const result = await batchCreate.mutateAsync(users);
      setResults(result.results);
      
      const successCount = result.results.filter((r) => r.success).length;
      const failCount = result.results.filter((r) => !r.success).length;

      toast({
        title: "Operação concluída",
        description: `${successCount} usuário(s) criado(s), ${failCount} falha(s)`,
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
              <div>
                <Label>Formato: email,senha,nome,username,role</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas email e senha são obrigatórios. Role pode ser "user" ou "admin".
                </p>
              </div>

              <Textarea
                placeholder={`joao@exemplo.com,senha123,João Silva,joaosilva,user
maria@exemplo.com,senha456,Maria Santos,mariasantos,admin
pedro@exemplo.com,senha789`}
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
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
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="font-mono text-sm">{result.email}</span>
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

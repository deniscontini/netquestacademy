 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Input } from "@/components/ui/input";
 import { useUpdateSubscription, SubscriptionPlan } from "@/hooks/useSubscriptions";
 import { useToast } from "@/hooks/use-toast";
 import { Crown, Sparkles, Building2 } from "lucide-react";
 
 interface ChangePlanDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   userId: string;
   userName: string;
   currentPlan: SubscriptionPlan;
 }
 
 const ChangePlanDialog = ({
   open,
   onOpenChange,
   userId,
   userName,
   currentPlan,
 }: ChangePlanDialogProps) => {
   const [plan, setPlan] = useState<SubscriptionPlan>(currentPlan);
   const [expiresAt, setExpiresAt] = useState<string>("");
   const updateSubscription = useUpdateSubscription();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     try {
       await updateSubscription.mutateAsync({
         userId,
         plan,
         expiresAt: expiresAt || null,
       });
 
       toast({
         title: "Sucesso",
         description: `Plano de ${userName} alterado para ${plan}`,
       });
 
       onOpenChange(false);
     } catch (error: any) {
       toast({
         title: "Erro",
         description: error.message || "Não foi possível alterar o plano",
         variant: "destructive",
       });
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Alterar Plano</DialogTitle>
           <DialogDescription>
             Alterar o plano de assinatura de <strong>{userName}</strong>
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="plan">Plano</Label>
             <Select value={plan} onValueChange={(v) => setPlan(v as SubscriptionPlan)}>
               <SelectTrigger id="plan">
                 <SelectValue placeholder="Selecione o plano" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="gratuito">
                   <div className="flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-muted-foreground" />
                     Gratuito
                   </div>
                 </SelectItem>
                 <SelectItem value="pro">
                   <div className="flex items-center gap-2">
                     <Crown className="w-4 h-4 text-primary" />
                     Pro
                   </div>
                 </SelectItem>
                 <SelectItem value="enterprise">
                   <div className="flex items-center gap-2">
                     <Building2 className="w-4 h-4 text-destructive" />
                     Enterprise
                   </div>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="expires">Data de Expiração (opcional)</Label>
             <Input
               id="expires"
               type="date"
               value={expiresAt}
               onChange={(e) => setExpiresAt(e.target.value)}
             />
             <p className="text-xs text-muted-foreground">
               Deixe em branco para plano sem expiração
             </p>
           </div>
 
           <DialogFooter>
             <Button
               type="button"
               variant="outline"
               onClick={() => onOpenChange(false)}
             >
               Cancelar
             </Button>
             <Button type="submit" disabled={updateSubscription.isPending}>
               {updateSubscription.isPending ? "Salvando..." : "Salvar"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ChangePlanDialog;
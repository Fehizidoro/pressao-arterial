import DashboardLayout from "@/components/DashboardLayout";
import { usePatient } from "@/contexts/PatientContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Edit2, PlusCircle, Star, Trash2, User, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Patient = {
  id: number;
  name: string;
  birthDate: string | null;
  gender: "male" | "female" | "other" | null;
  notes: string | null;
  isDefault: number;
  createdAt: Date;
};

export default function Patients() {
  return (
    <DashboardLayout>
      <PatientsContent />
    </DashboardLayout>
  );
}

function PatientsContent() {
  const { patients, isLoading, refetch, setSelectedPatient } = usePatient();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.patients.create.useMutation({
    onSuccess: () => {
      utils.patients.list.invalidate();
      refetch();
      setShowCreate(false);
      toast.success("Paciente criado com sucesso!");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => {
      utils.patients.list.invalidate();
      refetch();
      setEditPatient(null);
      toast.success("Paciente atualizado!");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const deleteMutation = trpc.patients.delete.useMutation({
    onSuccess: () => {
      utils.patients.list.invalidate();
      utils.measurements.list.invalidate();
      utils.measurements.stats.invalidate();
      refetch();
      setDeleteId(null);
      toast.success("Paciente removido");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const handleSetDefault = (id: number) => {
    updateMutation.mutate({ id, isDefault: 1 });
    const p = patients.find((p) => p.id === id);
    if (p) setSelectedPatient(p);
  };

  const genderLabel = (g: string | null) => {
    if (g === "male") return "Masculino";
    if (g === "female") return "Feminino";
    if (g === "other") return "Outro";
    return "—";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os perfis de monitoramento</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Novo Paciente
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card className="bp-card-shadow">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-foreground mb-1">Nenhum paciente cadastrado</h3>
              <p className="text-sm text-muted-foreground">Crie um perfil para começar a registrar medições.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Criar primeiro perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {patients.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "bp-card-shadow transition-all duration-200 hover:bp-card-shadow-hover",
                p.isDefault === 1 && "border-primary/30 bg-accent/20"
              )}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      p.isDefault === 1 ? "gradient-primary" : "bg-muted"
                    )}>
                      <User className={cn("w-5 h-5", p.isDefault === 1 ? "text-white" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-semibold text-foreground">{p.name}</h3>
                        {p.isDefault === 1 && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {genderLabel(p.gender)}
                        {p.birthDate && ` · ${p.birthDate}`}
                      </p>
                    </div>
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.notes}</p>
                )}

                <p className="text-xs text-muted-foreground mb-4">
                  Criado em {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {p.isDefault !== 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleSetDefault(p.id)}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Definir padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditPatient(p as Patient)}
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <PatientFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo Paciente"
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editPatient && (
        <PatientFormDialog
          open={!!editPatient}
          onClose={() => setEditPatient(null)}
          title="Editar Paciente"
          initialValues={editPatient}
          onSubmit={(data) => updateMutation.mutate({ id: editPatient.id, ...data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as medições deste paciente também serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PatientFormDialog({
  open,
  onClose,
  title,
  initialValues,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValues?: Partial<Patient>;
  onSubmit: (data: { name: string; birthDate?: string; gender?: "male" | "female" | "other"; notes?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(initialValues?.gender ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    onSubmit({
      name: name.trim(),
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Nome completo *</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-birth">Data de nascimento</Label>
              <Input id="p-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-notes">Observações</Label>
            <Textarea id="p-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições de saúde, medicamentos, etc." rows={3} maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

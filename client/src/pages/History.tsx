import DashboardLayout from "@/components/DashboardLayout";
import { BPBadge } from "@/components/BPBadge";
import { usePatient } from "@/contexts/PatientContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Heart, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { BPClassification } from "@shared/bloodPressure";

const PAGE_SIZE = 20;

export default function History() {
  return (
    <DashboardLayout>
      <HistoryContent />
    </DashboardLayout>
  );
}

function HistoryContent() {
  const { selectedPatient } = usePatient();
  const [, navigate] = useLocation();
  const [offset, setOffset] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [chartDays, setChartDays] = useState<7 | 30 | 90>(30);
  const utils = trpc.useUtils();

  const { data: measurements = [], isLoading } = trpc.measurements.list.useQuery(
    { patientId: selectedPatient?.id ?? 0, limit: PAGE_SIZE, offset },
    { enabled: !!selectedPatient }
  );

  const { data: chartData } = trpc.measurements.chart.useQuery(
    { patientId: selectedPatient?.id ?? 0, days: chartDays },
    { enabled: !!selectedPatient }
  );

  const formattedChartData = useMemo(() => {
    if (!chartData) return [];
    return chartData.map((m) => ({
      date: format(new Date(m.measuredAt), "dd/MM", { locale: ptBR }),
      sistólica: m.systolic,
      diastólica: m.diastolic,
      "freq. cardíaca": m.heartRate ?? undefined,
    }));
  }, [chartData]);

  const deleteMutation = trpc.measurements.delete.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      utils.measurements.stats.invalidate();
      utils.measurements.chart.invalidate();
      toast.success("Medição removida");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao remover medição"),
  });

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <Activity className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">Selecione um paciente para ver o histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Histórico de Medições</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{selectedPatient.name}</p>
        </div>
        <Button onClick={() => navigate("/nova-medicao")} size="sm" className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Medição
        </Button>
      </div>

      {/* Chart */}
      <Card className="bp-card-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-serif font-semibold">Gráfico de Evolução</CardTitle>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={chartDays === d ? "default" : "outline"}
                  className="h-7 text-xs px-3"
                  onClick={() => setChartDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formattedChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sem dados no período selecionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.012 240)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(0.88 0.012 240)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sistólica" stroke="oklch(0.55 0.22 25)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastólica" stroke="oklch(0.45 0.18 252)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="freq. cardíaca" stroke="oklch(0.55 0.18 162)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Measurements List */}
      <Card className="bp-card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif font-semibold">Lista de Medições</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : measurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <Activity className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground mb-1">Nenhuma medição registrada</p>
                <p className="text-sm text-muted-foreground">Registre a primeira medição para {selectedPatient.name}.</p>
              </div>
              <Button onClick={() => navigate("/nova-medicao")} size="sm" className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Registrar agora
              </Button>
            </div>
          ) : (
            <>
              {/* Table header — desktop */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Data / Hora</span>
                <span>Pressão</span>
                <span>Freq. Cardíaca</span>
                <span>Classificação</span>
                <span></span>
              </div>

              <div className="divide-y divide-border">
                {measurements.map((m) => (
                  <MeasurementRow
                    key={m.id}
                    measurement={m}
                    onDelete={() => setDeleteId(m.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {offset + 1}–{offset + measurements.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={measurements.length < PAGE_SIZE}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Próxima
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover medição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A medição será permanentemente removida.
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

function MeasurementRow({
  measurement,
  onDelete,
}: {
  measurement: {
    id: number;
    systolic: number;
    diastolic: number;
    heartRate: number | null;
    classification: BPClassification;
    notes: string | null;
    measuredAt: Date;
  };
  onDelete: () => void;
}) {
  const date = new Date(measurement.measuredAt);

  return (
    <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors items-center">
      {/* Date */}
      <div>
        <div className="text-sm font-medium text-foreground">
          {format(date, "dd/MM/yyyy", { locale: ptBR })}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(date, "HH:mm", { locale: ptBR })}
        </div>
      </div>

      {/* BP */}
      <div className="font-mono font-semibold text-foreground">
        {measurement.systolic}/{measurement.diastolic}
        <span className="text-xs font-sans font-normal text-muted-foreground ml-1">mmHg</span>
      </div>

      {/* Heart Rate */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {measurement.heartRate ? (
          <>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono font-medium text-foreground">{measurement.heartRate}</span>
            <span className="text-xs">bpm</span>
          </>
        ) : (
          <span className="text-xs">—</span>
        )}
      </div>

      {/* Classification */}
      <div>
        <BPBadge classification={measurement.classification} size="sm" />
        {measurement.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[160px]">{measurement.notes}</p>
        )}
      </div>

      {/* Actions */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

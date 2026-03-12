import DashboardLayout from "@/components/DashboardLayout";
import { BPBadge } from "@/components/BPBadge";
import { usePatient } from "@/contexts/PatientContext";
import { trpc } from "@/lib/trpc";
import { formatBP, getClassificationInfo } from "@shared/bloodPressure";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Heart,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { selectedPatient, patients, isLoading: patientsLoading } = usePatient();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.measurements.stats.useQuery(
    { patientId: selectedPatient?.id ?? 0 },
    { enabled: !!selectedPatient }
  );

  const { data: chartData, isLoading: chartLoading } = trpc.measurements.chart.useQuery(
    { patientId: selectedPatient?.id ?? 0, days: 30 },
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

  // Estado: sem pacientes cadastrados
  if (!patientsLoading && patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Bem-vindo ao CardioTrack
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Comece criando um perfil de paciente para registrar suas medições de pressão arterial.
          </p>
        </div>
        <Button onClick={() => navigate("/pacientes")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Criar primeiro perfil
        </Button>
      </div>
    );
  }

  // Estado: paciente selecionado mas sem medições
  if (!statsLoading && selectedPatient && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader patient={selectedPatient} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
              Nenhuma medição ainda
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Registre a primeira medição de pressão arterial para {selectedPatient.name}.
            </p>
          </div>
          <Button onClick={() => navigate("/nova-medicao")} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Registrar medição
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = patientsLoading || statsLoading;

  return (
    <div className="space-y-6 max-w-6xl">
      {selectedPatient && <PageHeader patient={selectedPatient} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Última Medição"
          isLoading={isLoading}
          icon={<Activity className="w-4 h-4" />}
          value={stats?.latest ? formatBP(stats.latest.systolic, stats.latest.diastolic) : "—"}
          sub={
            stats?.latest ? (
              <BPBadge classification={stats.latest.classification} size="sm" />
            ) : null
          }
        />
        <StatCard
          title="Média Sistólica"
          isLoading={isLoading}
          icon={<TrendingUp className="w-4 h-4" />}
          value={stats ? `${stats.avgSystolic} mmHg` : "—"}
          sub={
            stats?.trend ? (
              <TrendIndicator diff={stats.trend.systolicDiff} label="vs anterior" />
            ) : null
          }
        />
        <StatCard
          title="Média Diastólica"
          isLoading={isLoading}
          icon={<TrendingDown className="w-4 h-4" />}
          value={stats ? `${stats.avgDiastolic} mmHg` : "—"}
          sub={
            stats?.trend ? (
              <TrendIndicator diff={stats.trend.diastolicDiff} label="vs anterior" />
            ) : null
          }
        />
        <StatCard
          title="Freq. Cardíaca"
          isLoading={isLoading}
          icon={<Heart className="w-4 h-4" />}
          value={stats?.avgHeartRate ? `${stats.avgHeartRate} bpm` : "—"}
          sub={<span className="text-xs text-muted-foreground">média ({stats?.total ?? 0} medições)</span>}
        />
      </div>

      {/* Chart */}
      <Card className="bp-card-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif font-semibold">Evolução — últimos 30 dias</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/historico")}>
              Ver histórico <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : formattedChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para exibir no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={formattedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.012 240)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(0.88 0.012 240)", fontSize: 12 }}
                  formatter={(val: number, name: string) => [`${val} mmHg`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sistólica" stroke="oklch(0.55 0.22 25)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="diastólica" stroke="oklch(0.45 0.18 252)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="freq. cardíaca" stroke="oklch(0.55 0.18 162)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Classification Distribution */}
      {stats && stats.classificationCounts && Object.keys(stats.classificationCounts).length > 0 && (
        <Card className="bp-card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif font-semibold">Distribuição de Classificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.classificationCounts).map(([key, count]) => {
                const info = getClassificationInfo(key as any);
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={key} className={`rounded-xl p-3 border ${info.bgColor} ${info.borderColor}`}>
                    <div className={`text-2xl font-serif font-bold ${info.textColor}`}>{count}</div>
                    <div className={`text-xs font-medium mt-0.5 ${info.textColor}`}>{info.labelShort}</div>
                    <div className={`text-xs opacity-70 ${info.textColor}`}>{pct}% das medições</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => navigate("/nova-medicao")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Medição
        </Button>
        <Button variant="outline" onClick={() => navigate("/historico")} className="gap-2">
          <Activity className="w-4 h-4" />
          Ver Histórico
        </Button>
        <Button variant="outline" onClick={() => navigate("/relatorio")} className="gap-2">
          Ver Relatório PDF
        </Button>
      </div>
    </div>
  );
}

function PageHeader({ patient }: { patient: { name: string } }) {
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground capitalize">{patient.name}</h1>
        <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  isLoading,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <Card className="bp-card-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <span className="text-muted-foreground/60">{icon}</span>
        </div>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </>
        ) : (
          <>
            <div className="text-xl font-serif font-semibold text-foreground mb-1">{value}</div>
            <div>{sub}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ diff, label }: { diff: number; label: string }) {
  if (diff === 0) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" />{label}</span>;
  if (diff > 0) return <span className="text-xs text-red-600 flex items-center gap-1"><ArrowUp className="w-3 h-3" />+{diff} {label}</span>;
  return <span className="text-xs text-emerald-600 flex items-center gap-1"><ArrowDown className="w-3 h-3" />{diff} {label}</span>;
}

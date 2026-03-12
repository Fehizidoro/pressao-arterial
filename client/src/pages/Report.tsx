import DashboardLayout from "@/components/DashboardLayout";
import { BPBadge } from "@/components/BPBadge";
import { usePatient } from "@/contexts/PatientContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { classifyBloodPressure, getClassificationInfo, BPClassification } from "@shared/bloodPressure";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileText, Printer } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Report() {
  return (
    <DashboardLayout>
      <ReportContent />
    </DashboardLayout>
  );
}

function ReportContent() {
  const { selectedPatient } = usePatient();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: measurements = [], isLoading: measLoading } = trpc.measurements.list.useQuery(
    { patientId: selectedPatient?.id ?? 0, limit: 200 },
    { enabled: !!selectedPatient }
  );

  const { data: stats, isLoading: statsLoading } = trpc.measurements.stats.useQuery(
    { patientId: selectedPatient?.id ?? 0 },
    { enabled: !!selectedPatient }
  );

  const isLoading = measLoading || statsLoading;

  const handlePrint = () => {
    window.print();
  };

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <FileText className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">Selecione um paciente para gerar o relatório.</p>
      </div>
    );
  }

  const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  const genderLabel = selectedPatient.gender === "male" ? "Masculino" : selectedPatient.gender === "female" ? "Feminino" : selectedPatient.gender === "other" ? "Outro" : "—";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Relatório PDF</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{selectedPatient.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <div ref={printRef} className="bg-white rounded-2xl border border-border bp-card-shadow overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        {/* Report Header */}
        <div className="gradient-primary p-6 text-white print:bg-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif font-semibold text-lg">CardioTrack</span>
              </div>
              <h2 className="text-2xl font-serif font-bold mb-1">Relatório de Pressão Arterial</h2>
              <p className="text-white/80 text-sm">Gerado em {today}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dados do Paciente</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoBlock label="Nome" value={selectedPatient.name} />
              <InfoBlock label="Sexo" value={genderLabel} />
              <InfoBlock label="Data de Nascimento" value={selectedPatient.birthDate ?? "—"} />
              <InfoBlock label="Período" value={measurements.length > 0 ? `${format(new Date(measurements[measurements.length - 1].measuredAt), "dd/MM/yyyy")} – ${format(new Date(measurements[0].measuredAt), "dd/MM/yyyy")}` : "—"} />
            </div>
          </section>

          {/* Stats Summary */}
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : stats ? (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumo Estatístico</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBlock label="Total de Medições" value={stats.total.toString()} />
                <StatBlock label="Média Sistólica" value={`${stats.avgSystolic} mmHg`} />
                <StatBlock label="Média Diastólica" value={`${stats.avgDiastolic} mmHg`} />
                <StatBlock label="Freq. Cardíaca Média" value={stats.avgHeartRate ? `${stats.avgHeartRate} bpm` : "—"} />
                <StatBlock label="Sistólica Máx." value={`${stats.maxSystolic} mmHg`} />
                <StatBlock label="Sistólica Mín." value={`${stats.minSystolic} mmHg`} />
                <StatBlock label="Diastólica Máx." value={`${stats.maxDiastolic} mmHg`} />
                <StatBlock label="Diastólica Mín." value={`${stats.minDiastolic} mmHg`} />
              </div>
            </section>
          ) : null}

          {/* Classification Distribution */}
          {stats && Object.keys(stats.classificationCounts).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Distribuição de Classificações</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.classificationCounts).map(([key, count]) => {
                  const info = getClassificationInfo(key as BPClassification);
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${info.bgColor} ${info.borderColor}`}>
                      <span className={`text-sm font-medium ${info.textColor}`}>{info.labelShort}</span>
                      <span className={`text-sm font-bold ${info.textColor}`}>{count}×</span>
                      <span className={`text-xs opacity-70 ${info.textColor}`}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Measurements Table */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Histórico de Medições ({measurements.length})
            </h3>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : measurements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma medição registrada.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="text-left px-3 py-2.5 font-semibold text-foreground">Data</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-foreground">Hora</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-foreground">Sistólica</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-foreground">Diastólica</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-foreground">FC</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-foreground">Classificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m, i) => {
                      const date = new Date(m.measuredAt);
                      return (
                        <tr key={m.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="px-3 py-2 text-foreground">{format(date, "dd/MM/yyyy")}</td>
                          <td className="px-3 py-2 text-muted-foreground">{format(date, "HH:mm")}</td>
                          <td className="px-3 py-2 text-center font-mono font-semibold text-foreground">{m.systolic}</td>
                          <td className="px-3 py-2 text-center font-mono font-semibold text-foreground">{m.diastolic}</td>
                          <td className="px-3 py-2 text-center font-mono text-muted-foreground">{m.heartRate ?? "—"}</td>
                          <td className="px-3 py-2">
                            <BPBadge classification={m.classification as BPClassification} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            <p>Este relatório foi gerado pelo sistema CardioTrack em {today}.</p>
            <p className="mt-1">As informações contidas neste documento não substituem consulta médica profissional.</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [data-print-content], [data-print-content] * { visibility: visible; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-base font-serif font-semibold text-foreground">{value}</div>
    </div>
  );
}

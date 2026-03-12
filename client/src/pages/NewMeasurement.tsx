import DashboardLayout from "@/components/DashboardLayout";
import { BPBadge } from "@/components/BPBadge";
import { usePatient } from "@/contexts/PatientContext";
import { trpc } from "@/lib/trpc";
import { classifyBloodPressure, formatBP, getClassificationInfo } from "@shared/bloodPressure";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Heart, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function NewMeasurement() {
  return (
    <DashboardLayout>
      <NewMeasurementContent />
    </DashboardLayout>
  );
}

function NewMeasurementContent() {
  const { selectedPatient } = usePatient();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");
  const [measuredAt, setMeasuredAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [success, setSuccess] = useState(false);

  const createMutation = trpc.measurements.create.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      utils.measurements.stats.invalidate();
      utils.measurements.chart.invalidate();
      setSuccess(true);
      toast.success("Medição registrada com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao registrar medição: " + err.message);
    },
  });

  const preview = useMemo(() => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!isNaN(sys) && !isNaN(dia) && sys > 0 && dia > 0) {
      return classifyBloodPressure(sys, dia);
    }
    return null;
  }, [systolic, diastolic]);

  const previewInfo = preview ? getClassificationInfo(preview) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error("Selecione um paciente primeiro"); return; }

    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    const hr = heartRate ? parseInt(heartRate) : undefined;

    if (isNaN(sys) || isNaN(dia)) { toast.error("Informe valores válidos para sistólica e diastólica"); return; }

    createMutation.mutate({
      patientId: selectedPatient.id,
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      notes: notes || undefined,
      measuredAt: new Date(measuredAt).toISOString(),
    });
  };

  const handleReset = () => {
    setSystolic("");
    setDiastolic("");
    setHeartRate("");
    setNotes("");
    setMeasuredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setSuccess(false);
  };

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <div>
          <h3 className="font-serif font-semibold text-foreground mb-1">Nenhum paciente selecionado</h3>
          <p className="text-sm text-muted-foreground">Crie um perfil de paciente para registrar medições.</p>
        </div>
        <Button onClick={() => navigate("/pacientes")}>Gerenciar Pacientes</Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bp-card-shadow text-center">
          <CardContent className="pt-10 pb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-2">Medição registrada!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              A medição de {selectedPatient.name} foi salva com sucesso.
            </p>
            {preview && <div className="flex justify-center mb-6"><BPBadge classification={preview} size="lg" /></div>}
            <div className="flex gap-3 justify-center">
              <Button onClick={handleReset} variant="outline">Nova Medição</Button>
              <Button onClick={() => navigate("/dashboard")}>Ver Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Nova Medição</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registrando para <span className="font-medium text-foreground">{selectedPatient.name}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="md:col-span-3 bp-card-shadow">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Systolic / Diastolic */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic" className="text-sm font-medium">
                    Sistólica <span className="text-muted-foreground font-normal">(mmHg)</span>
                  </Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    min={50}
                    max={300}
                    required
                    className="text-lg font-mono h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic" className="text-sm font-medium">
                    Diastólica <span className="text-muted-foreground font-normal">(mmHg)</span>
                  </Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    min={30}
                    max={200}
                    required
                    className="text-lg font-mono h-12"
                  />
                </div>
              </div>

              {/* Heart Rate */}
              <div className="space-y-2">
                <Label htmlFor="heartRate" className="text-sm font-medium">
                  Frequência Cardíaca <span className="text-muted-foreground font-normal">(bpm — opcional)</span>
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  min={20}
                  max={300}
                  className="font-mono"
                />
              </div>

              {/* Date/Time */}
              <div className="space-y-2">
                <Label htmlFor="measuredAt" className="text-sm font-medium">Data e Hora da Medição</Label>
                <Input
                  id="measuredAt"
                  type="datetime-local"
                  value={measuredAt}
                  onChange={(e) => setMeasuredAt(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Observações <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: medido em repouso, após exercício, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Salvando..." : "Registrar Medição"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="md:col-span-2 space-y-4">
          {/* Live Classification Preview */}
          <Card className={`bp-card-shadow transition-all duration-300 ${previewInfo ? previewInfo.bgColor : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Classificação Prévia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview && previewInfo ? (
                <div className="space-y-3">
                  <BPBadge classification={preview} size="lg" />
                  <div className={`text-2xl font-serif font-bold ${previewInfo.textColor}`}>
                    {systolic}/{diastolic}
                    <span className="text-sm font-normal ml-1">mmHg</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${previewInfo.textColor} opacity-80`}>
                    {previewInfo.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preencha sistólica e diastólica para ver a classificação.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reference Card */}
          <Card className="bp-card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Referência Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: "Normal", range: "< 130/80", color: "text-emerald-700", dot: "bg-emerald-500" },
                  { label: "Elevada", range: "130–139/80–89", color: "text-amber-700", dot: "bg-amber-500" },
                  { label: "HAS Grau 1", range: "140–159/90–99", color: "text-orange-700", dot: "bg-orange-500" },
                  { label: "HAS Grau 2", range: "160–179/100–109", color: "text-red-700", dot: "bg-red-500" },
                  { label: "HAS Grau 3", range: "≥ 180/≥ 110", color: "text-rose-800", dot: "bg-rose-600" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <span className={`flex items-center gap-1.5 font-medium ${r.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                      {r.label}
                    </span>
                    <span className="text-muted-foreground font-mono">{r.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Heart Rate Reference */}
          <Card className="bp-card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Frequência Cardíaca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Bradicardia</span><span className="font-mono">&lt; 60 bpm</span></div>
                <div className="flex justify-between"><span className="text-emerald-700 font-medium">Normal</span><span className="font-mono text-emerald-700">60–100 bpm</span></div>
                <div className="flex justify-between"><span>Taquicardia</span><span className="font-mono">&gt; 100 bpm</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

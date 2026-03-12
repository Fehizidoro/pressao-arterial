/**
 * Classificação da pressão arterial conforme diretrizes da
 * American Heart Association (AHA) / Sociedade Brasileira de Cardiologia (SBC)
 */

export type BPClassification =
  | "hypotension"
  | "normal"
  | "elevated"
  | "hypertension_1"
  | "hypertension_2"
  | "hypertension_3";

export interface BPClassificationInfo {
  key: BPClassification;
  label: string;
  labelShort: string;
  description: string;
  color: string;       // Tailwind color class
  bgColor: string;     // Tailwind bg class
  textColor: string;   // Tailwind text class
  borderColor: string; // Tailwind border class
  severity: number;    // 0 = mais baixo, 5 = mais alto
}

export const BP_CLASSIFICATIONS: Record<BPClassification, BPClassificationInfo> = {
  hypotension: {
    key: "hypotension",
    label: "Hipotensão",
    labelShort: "Hipotensão",
    description: "Pressão arterial abaixo do normal. Consulte um médico.",
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    severity: 0,
  },
  normal: {
    key: "normal",
    label: "Normal",
    labelShort: "Normal",
    description: "Pressão arterial dentro dos limites saudáveis.",
    color: "emerald",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    severity: 1,
  },
  elevated: {
    key: "elevated",
    label: "Elevada",
    labelShort: "Elevada",
    description: "Pressão levemente elevada. Adote hábitos saudáveis.",
    color: "yellow",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    severity: 2,
  },
  hypertension_1: {
    key: "hypertension_1",
    label: "Hipertensão Grau 1",
    labelShort: "HAS Grau 1",
    description: "Hipertensão estágio 1. Recomenda-se acompanhamento médico.",
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    severity: 3,
  },
  hypertension_2: {
    key: "hypertension_2",
    label: "Hipertensão Grau 2",
    labelShort: "HAS Grau 2",
    description: "Hipertensão estágio 2. Tratamento médico necessário.",
    color: "red",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    severity: 4,
  },
  hypertension_3: {
    key: "hypertension_3",
    label: "Hipertensão Grau 3",
    labelShort: "HAS Grau 3",
    description: "Hipertensão estágio 3 (grave). Procure atendimento médico urgente.",
    color: "rose",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
    severity: 5,
  },
};

/**
 * Classifica a pressão arterial com base nos valores sistólico e diastólico.
 * Referência: AHA 2017 / SBC 2020
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): BPClassification {
  // Hipotensão
  if (systolic < 90 || diastolic < 60) return "hypotension";

  // Hipertensão Grau 3 (Crise hipertensiva)
  if (systolic >= 180 || diastolic >= 110) return "hypertension_3";

  // Hipertensão Grau 2
  if (systolic >= 160 || diastolic >= 100) return "hypertension_2";

  // Hipertensão Grau 1
  if (systolic >= 140 || diastolic >= 90) return "hypertension_1";

  // Elevada (pré-hipertensão)
  if (systolic >= 130 || diastolic >= 80) return "elevated";

  // Normal
  return "normal";
}

export function getClassificationInfo(classification: BPClassification): BPClassificationInfo {
  return BP_CLASSIFICATIONS[classification];
}

export function formatBP(systolic: number, diastolic: number): string {
  return `${systolic}/${diastolic} mmHg`;
}

export function getBPStatusColor(classification: BPClassification): string {
  const colors: Record<BPClassification, string> = {
    hypotension: "#3b82f6",
    normal: "#10b981",
    elevated: "#f59e0b",
    hypertension_1: "#f97316",
    hypertension_2: "#ef4444",
    hypertension_3: "#f43f5e",
  };
  return colors[classification];
}

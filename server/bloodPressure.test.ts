import { describe, expect, it } from "vitest";
import { classifyBloodPressure, getClassificationInfo, formatBP, getBPStatusColor } from "../shared/bloodPressure";

describe("classifyBloodPressure", () => {
  // Hipotensão
  it("classifica como hipotensão quando sistólica < 90", () => {
    expect(classifyBloodPressure(85, 60)).toBe("hypotension");
  });

  it("classifica como hipotensão quando diastólica < 60", () => {
    expect(classifyBloodPressure(100, 55)).toBe("hypotension");
  });

  it("classifica como hipotensão quando ambos baixos", () => {
    expect(classifyBloodPressure(80, 50)).toBe("hypotension");
  });

  // Normal
  it("classifica como elevada para 120/80 (AHA 2017: sistólica >= 130 OU diastólica >= 80 = elevada)", () => {
    // Conforme AHA 2017: diastólica = 80 já é limiar de 'elevated'
    expect(classifyBloodPressure(120, 80)).toBe("elevated");
  });

  it("classifica como normal para 110/70", () => {
    expect(classifyBloodPressure(110, 70)).toBe("normal");
  });

  it("classifica como normal no limite inferior (90/60)", () => {
    expect(classifyBloodPressure(90, 60)).toBe("normal");
  });

  it("classifica como normal para 129/79", () => {
    expect(classifyBloodPressure(129, 79)).toBe("normal");
  });

  // Elevada
  it("classifica como elevada para 130/80", () => {
    expect(classifyBloodPressure(130, 80)).toBe("elevated");
  });

  it("classifica como elevada para 135/85", () => {
    expect(classifyBloodPressure(135, 85)).toBe("elevated");
  });

  it("classifica como elevada para 139/89", () => {
    expect(classifyBloodPressure(139, 89)).toBe("elevated");
  });

  // Hipertensão Grau 1
  it("classifica como hipertensão grau 1 para 140/90", () => {
    expect(classifyBloodPressure(140, 90)).toBe("hypertension_1");
  });

  it("classifica como hipertensão grau 1 para 150/95", () => {
    expect(classifyBloodPressure(150, 95)).toBe("hypertension_1");
  });

  it("classifica como hipertensão grau 1 para 159/99", () => {
    expect(classifyBloodPressure(159, 99)).toBe("hypertension_1");
  });

  // Hipertensão Grau 2
  it("classifica como hipertensão grau 2 para 160/100", () => {
    expect(classifyBloodPressure(160, 100)).toBe("hypertension_2");
  });

  it("classifica como hipertensão grau 2 para 170/105", () => {
    expect(classifyBloodPressure(170, 105)).toBe("hypertension_2");
  });

  it("classifica como hipertensão grau 2 para 179/109", () => {
    expect(classifyBloodPressure(179, 109)).toBe("hypertension_2");
  });

  // Hipertensão Grau 3
  it("classifica como hipertensão grau 3 para 180/110", () => {
    expect(classifyBloodPressure(180, 110)).toBe("hypertension_3");
  });

  it("classifica como hipertensão grau 3 para 200/120", () => {
    expect(classifyBloodPressure(200, 120)).toBe("hypertension_3");
  });

  it("classifica como hipertensão grau 3 quando apenas sistólica >= 180", () => {
    expect(classifyBloodPressure(185, 85)).toBe("hypertension_3");
  });

  it("classifica como hipertensão grau 3 quando apenas diastólica >= 110", () => {
    expect(classifyBloodPressure(150, 115)).toBe("hypertension_3");
  });

  // Casos de borda com diastólica elevada
  it("classifica pela diastólica quando sistólica é normal mas diastólica é elevada", () => {
    expect(classifyBloodPressure(120, 90)).toBe("hypertension_1");
  });

  it("classifica pela sistólica quando sistólica é elevada mas diastólica é normal", () => {
    expect(classifyBloodPressure(145, 75)).toBe("hypertension_1");
  });
});

describe("getClassificationInfo", () => {
  it("retorna informações corretas para 'normal'", () => {
    const info = getClassificationInfo("normal");
    expect(info.key).toBe("normal");
    expect(info.label).toBe("Normal");
    expect(info.severity).toBe(1);
  });

  it("retorna informações corretas para 'hypertension_3'", () => {
    const info = getClassificationInfo("hypertension_3");
    expect(info.key).toBe("hypertension_3");
    expect(info.severity).toBe(5);
  });

  it("todas as classificações têm severity único e crescente", () => {
    const classifications = ["hypotension", "normal", "elevated", "hypertension_1", "hypertension_2", "hypertension_3"] as const;
    const severities = classifications.map((c) => getClassificationInfo(c).severity);
    const sorted = [...severities].sort((a, b) => a - b);
    expect(severities).toEqual(sorted);
  });
});

describe("formatBP", () => {
  it("formata corretamente", () => {
    expect(formatBP(120, 80)).toBe("120/80 mmHg");
    expect(formatBP(140, 90)).toBe("140/90 mmHg");
  });
});

describe("getBPStatusColor", () => {
  it("retorna cores hex válidas", () => {
    const color = getBPStatusColor("normal");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("retorna cor diferente para cada classificação", () => {
    const colors = new Set([
      getBPStatusColor("hypotension"),
      getBPStatusColor("normal"),
      getBPStatusColor("elevated"),
      getBPStatusColor("hypertension_1"),
      getBPStatusColor("hypertension_2"),
      getBPStatusColor("hypertension_3"),
    ]);
    expect(colors.size).toBe(6);
  });
});

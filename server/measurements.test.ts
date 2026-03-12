import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock das funções de banco de dados
vi.mock("./db", () => ({
  getPatientById: vi.fn(),
  getMeasurementsByPatient: vi.fn(),
  getMeasurementById: vi.fn(),
  createMeasurement: vi.fn(),
  deleteMeasurement: vi.fn(),
  getMeasurementStats: vi.fn(),
  getRecentMeasurementsForChart: vi.fn(),
  getPatientsByUserId: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import {
  getPatientById,
  getMeasurementsByPatient,
  getMeasurementById,
  createMeasurement,
  deleteMeasurement,
  getMeasurementStats,
  getPatientsByUserId,
  createPatient,
  updatePatient,
  deletePatient,
} from "./db";

function createMockContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockPatient = {
  id: 1,
  userId: 1,
  name: "João Silva",
  birthDate: "1980-01-01",
  gender: "male" as const,
  notes: null,
  isDefault: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMeasurement = {
  id: 1,
  patientId: 1,
  userId: 1,
  systolic: 120,
  diastolic: 80,
  heartRate: 72,
  classification: "normal" as const,
  notes: null,
  measuredAt: new Date(),
  createdAt: new Date(),
};

describe("measurements.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria medição com classificação automática correta", async () => {
    vi.mocked(getPatientById).mockResolvedValue(mockPatient);
    vi.mocked(createMeasurement).mockResolvedValue({ id: 1 });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.measurements.create({
      patientId: 1,
      systolic: 120,
      diastolic: 80,
      heartRate: 72,
      measuredAt: new Date().toISOString(),
    });

    expect(createMeasurement).toHaveBeenCalledWith(
      expect.objectContaining({
        systolic: 120,
        diastolic: 80,
        classification: "elevated", // AHA 2017: diastólica = 80 é limiar de 'elevated'
      })
    );
  });

  it("classifica hipertensão grau 1 automaticamente", async () => {
    vi.mocked(getPatientById).mockResolvedValue(mockPatient);
    vi.mocked(createMeasurement).mockResolvedValue({ id: 2 });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await caller.measurements.create({
      patientId: 1,
      systolic: 145,
      diastolic: 92,
      measuredAt: new Date().toISOString(),
    });

    expect(createMeasurement).toHaveBeenCalledWith(
      expect.objectContaining({ classification: "hypertension_1" })
    );
  });

  it("lança NOT_FOUND quando paciente não pertence ao usuário", async () => {
    vi.mocked(getPatientById).mockResolvedValue(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.measurements.create({
        patientId: 999,
        systolic: 120,
        diastolic: 80,
        measuredAt: new Date().toISOString(),
      })
    ).rejects.toThrow("Paciente não encontrado");
  });

  it("valida limites de sistólica", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.measurements.create({
        patientId: 1,
        systolic: 30, // abaixo do mínimo (50)
        diastolic: 80,
        measuredAt: new Date().toISOString(),
      })
    ).rejects.toThrow();
  });
});

describe("measurements.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deleta medição existente com sucesso", async () => {
    vi.mocked(getMeasurementById).mockResolvedValue(mockMeasurement);
    vi.mocked(deleteMeasurement).mockResolvedValue(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.measurements.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(deleteMeasurement).toHaveBeenCalledWith(1, 1);
  });

  it("lança NOT_FOUND para medição inexistente", async () => {
    vi.mocked(getMeasurementById).mockResolvedValue(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.measurements.delete({ id: 999 })).rejects.toThrow("Medição não encontrada");
  });
});

describe("patients.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria paciente com dados válidos", async () => {
    vi.mocked(createPatient).mockResolvedValue({ id: 1 });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.create({
      name: "Maria Santos",
      gender: "female",
      birthDate: "1990-05-15",
    });

    expect(createPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Maria Santos",
        gender: "female",
        userId: 1,
      })
    );
  });

  it("valida nome mínimo de 2 caracteres", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.patients.create({ name: "A" })).rejects.toThrow();
  });
});

describe("patients.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deleta paciente com sucesso", async () => {
    vi.mocked(deletePatient).mockResolvedValue(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(deletePatient).toHaveBeenCalledWith(1, 1);
  });
});

describe("auth.logout", () => {
  it("limpa cookie de sessão e retorna sucesso", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test",
        email: "test@example.com",
        name: "Test",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

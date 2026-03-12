import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, measurements, patients, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function getPatientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patients).where(eq(patients.userId, userId)).orderBy(desc(patients.isDefault), patients.name);
}

export async function getPatientById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(and(eq(patients.id, id), eq(patients.userId, userId))).limit(1);
  return result[0];
}

export async function createPatient(data: {
  userId: number;
  name: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  notes?: string;
  isDefault?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se for o primeiro paciente, define como padrão
  const existing = await getPatientsByUserId(data.userId);
  const isDefault = existing.length === 0 ? 1 : (data.isDefault ?? 0);

  // Se novo padrão, remove padrão dos outros
  if (isDefault === 1) {
    await db.update(patients).set({ isDefault: 0 }).where(eq(patients.userId, data.userId));
  }

  const [result] = await db.insert(patients).values({ ...data, isDefault }).$returningId();
  return result;
}

export async function updatePatient(
  id: number,
  userId: number,
  data: Partial<{ name: string; birthDate: string; gender: "male" | "female" | "other"; notes: string; isDefault: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.isDefault === 1) {
    await db.update(patients).set({ isDefault: 0 }).where(eq(patients.userId, userId));
  }

  await db.update(patients).set(data).where(and(eq(patients.id, id), eq(patients.userId, userId)));
}

export async function deletePatient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Deleta medições associadas
  await db.delete(measurements).where(and(eq(measurements.patientId, id), eq(measurements.userId, userId)));
  await db.delete(patients).where(and(eq(patients.id, id), eq(patients.userId, userId)));
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export async function getMeasurementsByPatient(
  patientId: number,
  userId: number,
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(measurements)
    .where(and(eq(measurements.patientId, patientId), eq(measurements.userId, userId)))
    .orderBy(desc(measurements.measuredAt))
    .limit(limit)
    .offset(offset);
}

export async function getMeasurementById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(measurements).where(and(eq(measurements.id, id), eq(measurements.userId, userId))).limit(1);
  return result[0];
}

export async function createMeasurement(data: {
  patientId: number;
  userId: number;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  classification: "normal" | "elevated" | "hypertension_1" | "hypertension_2" | "hypertension_3" | "hypotension";
  notes?: string;
  measuredAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(measurements).values(data).$returningId();
  return result;
}

export async function deleteMeasurement(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(measurements).where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
}

export async function getMeasurementStats(patientId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const all = await db
    .select()
    .from(measurements)
    .where(and(eq(measurements.patientId, patientId), eq(measurements.userId, userId)))
    .orderBy(desc(measurements.measuredAt))
    .limit(30);

  if (all.length === 0) return null;

  const avgSystolic = Math.round(all.reduce((s, m) => s + m.systolic, 0) / all.length);
  const avgDiastolic = Math.round(all.reduce((s, m) => s + m.diastolic, 0) / all.length);
  const avgHeartRate = all.filter(m => m.heartRate).length > 0
    ? Math.round(all.filter(m => m.heartRate).reduce((s, m) => s + (m.heartRate ?? 0), 0) / all.filter(m => m.heartRate).length)
    : null;

  const maxSystolic = Math.max(...all.map(m => m.systolic));
  const minSystolic = Math.min(...all.map(m => m.systolic));
  const maxDiastolic = Math.max(...all.map(m => m.diastolic));
  const minDiastolic = Math.min(...all.map(m => m.diastolic));

  const classificationCounts: Record<string, number> = {};
  for (const m of all) {
    classificationCounts[m.classification] = (classificationCounts[m.classification] ?? 0) + 1;
  }

  const latest = all[0];
  const previous = all[1];

  return {
    total: all.length,
    avgSystolic,
    avgDiastolic,
    avgHeartRate,
    maxSystolic,
    minSystolic,
    maxDiastolic,
    minDiastolic,
    classificationCounts,
    latest,
    previous,
    trend: previous
      ? {
          systolicDiff: latest.systolic - previous.systolic,
          diastolicDiff: latest.diastolic - previous.diastolic,
        }
      : null,
  };
}

export async function getRecentMeasurementsForChart(patientId: number, userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.patientId, patientId),
        eq(measurements.userId, userId),
        gte(measurements.measuredAt, since)
      )
    )
    .orderBy(measurements.measuredAt)
    .limit(200);
}

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Perfis de pacientes (um usuário pode monitorar múltiplos pacientes)
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  birthDate: varchar("birthDate", { length: 10 }), // YYYY-MM-DD
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  notes: text("notes"),
  isDefault: int("isDefault").default(0).notNull(), // 1 = perfil padrão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Medições de pressão arterial
export const measurements = mysqlTable("measurements", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(),
  systolic: int("systolic").notNull(),    // Pressão sistólica (mmHg)
  diastolic: int("diastolic").notNull(),  // Pressão diastólica (mmHg)
  heartRate: int("heartRate"),            // Frequência cardíaca (bpm)
  // Classificação automática
  classification: mysqlEnum("classification", [
    "normal",
    "elevated",
    "hypertension_1",
    "hypertension_2",
    "hypertension_3",
    "hypotension",
  ]).notNull(),
  notes: text("notes"),
  measuredAt: timestamp("measuredAt").notNull(), // Data/hora da medição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;

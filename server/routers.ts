import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { classifyBloodPressure } from "@shared/bloodPressure";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createMeasurement,
  createPatient,
  deleteMeasurement,
  deletePatient,
  getMeasurementById,
  getMeasurementsByPatient,
  getMeasurementStats,
  getPatientById,
  getPatientsByUserId,
  getRecentMeasurementsForChart,
  updatePatient,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Patients ───────────────────────────────────────────────────────────────
  patients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getPatientsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const patient = await getPatientById(input.id, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        return patient;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(128),
          birthDate: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          notes: z.string().max(500).optional(),
          isDefault: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createPatient({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(128).optional(),
          birthDate: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          notes: z.string().max(500).optional(),
          isDefault: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updatePatient(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePatient(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Measurements ───────────────────────────────────────────────────────────
  measurements: router({
    list: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        // Verifica que o paciente pertence ao usuário
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        return getMeasurementsByPatient(input.patientId, ctx.user.id, input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          systolic: z.number().min(50).max(300),
          diastolic: z.number().min(30).max(200),
          heartRate: z.number().min(20).max(300).optional(),
          notes: z.string().max(500).optional(),
          measuredAt: z.string(), // ISO string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const classification = classifyBloodPressure(input.systolic, input.diastolic);

        return createMeasurement({
          patientId: input.patientId,
          userId: ctx.user.id,
          systolic: input.systolic,
          diastolic: input.diastolic,
          heartRate: input.heartRate,
          classification,
          notes: input.notes,
          measuredAt: new Date(input.measuredAt),
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const m = await getMeasurementById(input.id, ctx.user.id);
        if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Medição não encontrada" });
        await deleteMeasurement(input.id, ctx.user.id);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        return getMeasurementStats(input.patientId, ctx.user.id);
      }),

    chart: protectedProcedure
      .input(z.object({ patientId: z.number(), days: z.number().min(7).max(365).default(30) }))
      .query(async ({ ctx, input }) => {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        return getRecentMeasurementsForChart(input.patientId, ctx.user.id, input.days);
      }),
  }),
});

export type AppRouter = typeof appRouter;

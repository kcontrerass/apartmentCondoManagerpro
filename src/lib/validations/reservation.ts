import { z } from "zod";

const baseReservationSchema = z.object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    status: z.enum(["PENDING", "APPROVED", "CANCELLED", "REJECTED", "COMPLETED"]).optional(),
    notes: z.string().max(500).optional(),
    amenityId: z.string().min(1),
    userId: z.string().min(1),
    totalCost: z.number().optional(),
});

export const reservationSchema = baseReservationSchema.refine((data) => data.endTime > data.startTime, {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["endTime"],
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export const updateReservationSchema = baseReservationSchema.partial();
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

import { z } from "zod";

export const visitorStatusSchema = z.enum(["SCHEDULED", "ARRIVED", "DEPARTED", "CANCELLED"]);

function normalizeVehiclePlate(value: string): string {
    return value.toUpperCase().replace(/\s+/g, "").trim();
}

export const visitorLogSchema = z.object({
    visitorName: z.string().min(2, "El nombre del visitante es requerido"),
    visitorId: z.string().optional(),
    reason: z.string().optional(),
    /** Checkbox: puede ser undefined/false desde react-hook-form */
    arrivesInVehicle: z.boolean().optional(),
    vehiclePlate: z.string().optional(),
    scheduledDate: z.string().or(z.date()),
    unitId: z.string().min(1, "La unidad es requerida"),
    complexId: z.string().min(1, "El complejo es requerido"),
    status: visitorStatusSchema,
}).refine((data) => {
    if (data.arrivesInVehicle !== true) return true;
    return Boolean(data.vehiclePlate && normalizeVehiclePlate(data.vehiclePlate).length >= 3);
}, {
    message: "La placa es requerida si el visitante llega en vehículo",
    path: ["vehiclePlate"],
});

export type VisitorLogInput = z.infer<typeof visitorLogSchema>;

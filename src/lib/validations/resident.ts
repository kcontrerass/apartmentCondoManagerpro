import { z } from "zod";

const dateLikeOptional = z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return new Date(val);
    });

/** Shared rules when isAirbnb is true (full resident form and self-service form). */
export function addResidentAirbnbRules(
    data: {
        isAirbnb?: boolean;
        airbnbStartDate?: Date | undefined;
        airbnbEndDate?: Date | undefined;
        airbnbGuestName?: string | undefined;
        airbnbGuestIdentification?: string | undefined;
    },
    ctx: z.RefinementCtx
) {
    if (!data.isAirbnb) return;

    if (!data.airbnbStartDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de inicio de la estadía Airbnb es requerida",
            path: ["airbnbStartDate"],
        });
    }
    if (!data.airbnbEndDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de fin de la estadía Airbnb es requerida",
            path: ["airbnbEndDate"],
        });
    }
    const guest = data.airbnbGuestName?.trim();
    if (!guest) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El nombre del huésped principal es requerido",
            path: ["airbnbGuestName"],
        });
    }
    const idDoc = data.airbnbGuestIdentification?.trim();
    if (!idDoc) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La identificación del huésped es requerida",
            path: ["airbnbGuestIdentification"],
        });
    }
    if (data.airbnbStartDate && data.airbnbEndDate && data.airbnbEndDate < data.airbnbStartDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de fin debe ser igual o posterior a la de inicio",
            path: ["airbnbEndDate"],
        });
    }
}

/** Solo residente autenticado: actualizar datos Airbnb de su propia asignación. */
export const residentAirbnbSelfSchema = z
    .object({
        isAirbnb: z.boolean().optional().default(false),
        airbnbStartDate: dateLikeOptional,
        airbnbEndDate: dateLikeOptional,
        airbnbGuestName: z.string().optional(),
        airbnbReservationCode: z.string().optional(),
        airbnbGuestPhone: z.string().optional(),
        airbnbGuestIdentification: z.string().optional(),
    })
    .superRefine(addResidentAirbnbRules);

export type ResidentAirbnbSelfInput = z.infer<typeof residentAirbnbSelfSchema>;

export const residentSchema = z
    .object({
        userId: z.string().min(1, "El ID de usuario es requerido"),
        unitId: z.string().min(1, "El ID de unidad es requerido"),
        type: z.enum(["OWNER", "TENANT"]).default("TENANT"),
        startDate: z.string().or(z.date()).transform((val) => new Date(val)),
        endDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : undefined)),
        emergencyContact: z
            .object({
                name: z.string().min(1, "Nombre de contacto de emergencia requerido"),
                phone: z.string().min(1, "Teléfono de contacto de emergencia requerido"),
                relation: z.string().min(1, "Parentesco requerido"),
            })
            .optional(),
        isAirbnb: z.boolean().optional().default(false),
        airbnbStartDate: dateLikeOptional,
        airbnbEndDate: dateLikeOptional,
        airbnbGuestName: z.string().optional(),
        airbnbReservationCode: z.string().optional(),
        airbnbGuestPhone: z.string().optional(),
        airbnbGuestIdentification: z.string().optional(),
    })
    .superRefine(addResidentAirbnbRules);

export type ResidentInput = z.infer<typeof residentSchema>;

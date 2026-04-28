import { z } from "zod";

const dateLikeOptional = z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return new Date(val);
    });

/** Shared rules when isAirbnb is true or resident type is short-term Airbnb guest. */
export function addResidentAirbnbRules(
    data: {
        type?: string;
        isAirbnb?: boolean;
        airbnbStartDate?: Date | undefined;
        airbnbEndDate?: Date | undefined;
        airbnbGuestName?: string | undefined;
        airbnbGuestIdentification?: string | undefined;
    },
    ctx: z.RefinementCtx
) {
    const needsAirbnbFields = Boolean(data.isAirbnb || data.type === 'AIRBNB_GUEST');
    if (!needsAirbnbFields) return;

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

/** Sin refinamientos: Zod 4 no permite `.partial()` si el esquema ya tiene `.superRefine()`. */
export const residentBaseSchema = z.object({
    userId: z.string().min(1, "El ID de usuario es requerido"),
    unitId: z.string().min(1, "El ID de unidad es requerido"),
    type: z.enum(["OWNER", "TENANT", "AIRBNB_GUEST"]).default("TENANT"),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : undefined)),
    emergencyContact: z.preprocess(
        (val) => {
            if (val == null || typeof val !== "object") return undefined;
            const o = val as { name?: string; phone?: string; relation?: string };
            if (
                !(o.name ?? "").trim() &&
                !(o.phone ?? "").trim() &&
                !(o.relation ?? "").trim()
            ) {
                return undefined;
            }
            return val;
        },
        z
            .object({
                name: z.string().min(1, "Nombre de contacto de emergencia requerido"),
                phone: z.string().min(1, "Teléfono de contacto de emergencia requerido"),
                relation: z.string().min(1, "Parentesco requerido"),
            })
            .optional()
    ),
    isAirbnb: z.boolean().optional().default(false),
    airbnbStartDate: dateLikeOptional,
    airbnbEndDate: dateLikeOptional,
    airbnbGuestName: z.string().optional(),
    airbnbReservationCode: z.string().optional(),
    airbnbGuestPhone: z.string().optional(),
    airbnbGuestIdentification: z.string().optional(),
});

export const residentSchema = residentBaseSchema.superRefine(addResidentAirbnbRules);

/** PATCH /api/residents/[id]: campos opcionales + mismas reglas Airbnb cuando aplica. */
export const residentPatchSchema = residentBaseSchema.partial().superRefine(addResidentAirbnbRules);

export type ResidentInput = z.infer<typeof residentSchema>;
export type ResidentPatchInput = z.infer<typeof residentPatchSchema>;

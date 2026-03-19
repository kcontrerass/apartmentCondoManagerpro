import { z } from "zod";

export const residentAdminResetBodySchema = z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("generate") }),
    z
        .object({
            mode: z.literal("manual"),
            newPassword: z.string().min(6, "minLength"),
            confirmPassword: z.string().min(6, "minLength"),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
            message: "mismatch",
            path: ["confirmPassword"],
        }),
]);

export type ResidentAdminResetBody = z.infer<typeof residentAdminResetBodySchema>;

import { prisma } from "@/lib/db";

export type VisitorNotifyContext = {
    complexName: string;
    unitNumber: string | null;
};

export async function loadVisitorNotifyContext(
    complexId: string,
    unitId: string | null
): Promise<VisitorNotifyContext> {
    const [complex, unit] = await Promise.all([
        prisma.complex.findUnique({
            where: { id: complexId },
            select: { name: true },
        }),
        unitId
            ? prisma.unit.findUnique({
                  where: { id: unitId },
                  select: { number: true },
              })
            : Promise.resolve(null),
    ]);

    return {
        complexName: complex?.name?.trim() || "Complejo",
        unitNumber: unit?.number?.trim() || null,
    };
}

/** Texto para staff (incl. súper admin): siempre complejo + unidad legible + nombre del visitante. */
export function visitorStaffSiteLabel(ctx: VisitorNotifyContext): string {
    const unitPart = ctx.unitNumber != null ? `Unidad ${ctx.unitNumber}` : "Sin unidad";
    return `${ctx.complexName} · ${unitPart}`;
}

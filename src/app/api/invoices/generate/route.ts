import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { generateInvoicesSchema } from "@/lib/validations/invoice";
import { Role } from "@/types/roles";
import { generateInvoicesForComplex } from "@/lib/services/invoice-generation";
import { sendComplexNotification } from "@/lib/notifications";
import { pushDashboardUrl } from "@/lib/push-dashboard-paths";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = generateInvoicesSchema.parse(body);

        // RBAC check: Only SUPER_ADMIN, ADMIN or BOARD_OF_DIRECTORS of the complex
        if (session.user.role === Role.ADMIN || session.user.role === Role.BOARD_OF_DIRECTORS) {
            const userComplexId = (session.user as any).complexId;
            if (!userComplexId || userComplexId !== validatedData.complexId) {
                return NextResponse.json(
                    { error: "No tiene permiso sobre este complejo" },
                    { status: 403 }
                );
            }
        } else if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json(
                { error: "Permisos insuficientes" },
                { status: 403 }
            );
        }

        const { complexId, month, year } = validatedData;

        // Process generation in a transaction with increased timeout
        const result = await (prisma as any).$transaction(async (tx: any) => {
            return await generateInvoicesForComplex(tx, complexId, month, year);
        }, {
            timeout: 30000 // 30 seconds
        });

        if (result.generatedCount > 0) {
            // Notify residents about new invoices
            await sendComplexNotification(complexId, ['RESIDENT'], {
                title: 'Nueva Factura Generada',
                body: `Se han generado las facturas correspondientes a ${month}/${year}.`,
                url: pushDashboardUrl.invoices
            });
        }

        return NextResponse.json({
            message: `Generación completada`,
            generated: result.generatedCount,
            skipped: result.skippedCount
        });

    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error generating invoices:", error);
        return NextResponse.json(
            { error: error.message || "Error al generar facturas" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { sendUserNotification, sendComplexNotification } from "@/lib/notifications";
import { loadVisitorNotifyContext, visitorStaffSiteLabel } from "@/lib/visitor-notification-text";
import { apiError, apiOk } from "@/lib/api-response";
import { resolveUserScope } from "@/lib/user-scope";

const ALLOWED_STATUS = new Set(["SCHEDULED", "ARRIVED", "DEPARTED", "CANCELLED"]);

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || !ALLOWED_STATUS.has(status)) {
            return apiError({ code: "VALIDATION_ERROR", message: "Estado inválido" }, 422);
        }

        const existingLog = await prisma.visitorLog.findUnique({
            where: { id },
            select: { id: true, complexId: true, unitId: true, createdById: true, status: true },
        });
        if (!existingLog) {
            return apiError({ code: "NOT_FOUND", message: "Visitante no encontrado" }, 404);
        }

        if (session.user.role !== Role.SUPER_ADMIN) {
            const scope = await resolveUserScope(session.user.id);
            if (!scope?.complexId) {
                return apiError({ code: "FORBIDDEN", message: "Usuario sin complejo asignado" }, 403);
            }

            const isSameComplex = scope.complexId === existingLog.complexId;
            if (!isSameComplex) {
                return apiError(
                    { code: "FORBIDDEN", message: "No puedes modificar visitantes de otro complejo" },
                    403
                );
            }

            if (scope.role === Role.RESIDENT) {
                const isOwnVisitor = existingLog.createdById === session.user.id && existingLog.unitId === scope.unitId;
                const canCancelOnly = status === "CANCELLED" && existingLog.status === "SCHEDULED";
                if (!isOwnVisitor || !canCancelOnly) {
                    return apiError(
                        {
                            code: "FORBIDDEN",
                            message: "Solo puedes cancelar tus visitantes programados",
                        },
                        403
                    );
                }
            } else if (scope.role === Role.GUARD && !["ARRIVED", "DEPARTED"].includes(status)) {
                return apiError(
                    { code: "FORBIDDEN", message: "Guardias solo pueden registrar entrada/salida" },
                    403
                );
            }
        }

        const updateData: any = { status };

        if (status === "ARRIVED") {
            updateData.entryTime = new Date();
        } else if (status === "DEPARTED") {
            updateData.exitTime = new Date();
        }

        const log = await prisma.visitorLog.update({
            where: { id },
            data: updateData
        });

        // Notify the resident of the unit when visitor arrives
        if (status === "ARRIVED" && log.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: log.unitId },
                select: { userId: true }
            });

            if (resident) {
                // Notify the resident specifically
                await sendUserNotification(resident.userId, {
                    title: 'Visitante en Portería',
                    body: `${log.visitorName} ha llegado al complejo.`,
                    url: '/dashboard/visitors'
                });
            }

            const staffCtxArr = await loadVisitorNotifyContext(log.complexId, log.unitId);
            const siteArr = visitorStaffSiteLabel(staffCtxArr);

            // Notify administrative staff
            await sendComplexNotification(log.complexId, ['ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
                title: 'Check-in de Visitante',
                body: `${log.visitorName} ha ingresado (${siteArr}).`,
                url: '/dashboard/visitors'
            });
        } else if (status === "DEPARTED" && log.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: log.unitId },
                select: { userId: true }
            });

            if (resident) {
                // Notify the resident
                await sendUserNotification(resident.userId, {
                    title: 'Salida de Visitante',
                    body: `${log.visitorName} ha salido del complejo.`,
                    url: '/dashboard/visitors'
                });
            }

            const staffCtxDep = await loadVisitorNotifyContext(log.complexId, log.unitId);
            const siteDep = visitorStaffSiteLabel(staffCtxDep);

            // Notify administrative staff
            await sendComplexNotification(log.complexId, ['ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
                title: 'Check-out de Visitante',
                body: `${log.visitorName} ha salido del complejo (${siteDep}).`,
                url: '/dashboard/visitors'
            });
        }

        return apiOk(log);
    } catch (error) {
        console.error("Error updating visitor log:", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al actualizar visitante" }, 500);
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        const { id } = await params;
        const existingLog = await prisma.visitorLog.findUnique({
            where: { id },
            select: { id: true, complexId: true, unitId: true, createdById: true, status: true },
        });
        if (!existingLog) {
            return apiError({ code: "NOT_FOUND", message: "Visitante no encontrado" }, 404);
        }

        if (session.user.role !== Role.SUPER_ADMIN) {
            const scope = await resolveUserScope(session.user.id);
            if (!scope?.complexId) {
                return apiError({ code: "FORBIDDEN", message: "Usuario sin complejo asignado" }, 403);
            }

            if (scope.complexId !== existingLog.complexId) {
                return apiError(
                    { code: "FORBIDDEN", message: "No puedes eliminar visitantes de otro complejo" },
                    403
                );
            }

            if (scope.role === Role.RESIDENT) {
                const isOwnVisitor = existingLog.createdById === session.user.id && existingLog.unitId === scope.unitId;
                const canDelete = existingLog.status === "SCHEDULED";
                if (!isOwnVisitor || !canDelete) {
                    return apiError(
                        { code: "FORBIDDEN", message: "Solo puedes eliminar tus visitantes programados" },
                        403
                    );
                }
            }

            if (scope.role === Role.GUARD && existingLog.status !== "DEPARTED") {
                return apiError(
                    { code: "FORBIDDEN", message: "Guardias solo pueden eliminar visitantes con salida registrada" },
                    403
                );
            }
        }

        await prisma.visitorLog.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting visitor log:", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al eliminar visitante" }, 500);
    }
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { resolveUserScope } from "@/lib/user-scope";
import { visitorLogSchema } from "@/lib/validations/visitor";
import { Role } from "@/types/roles";
import { sendUserNotification, sendComplexNotification } from "@/lib/notifications";
import { loadVisitorNotifyContext, visitorStaffSiteLabel } from "@/lib/visitor-notification-text";
import { ZodError } from "zod";

const VEHICLE_MARKER = "[VEHICLE_PLATE]";

function buildReasonWithVehicleMeta(reason: string | undefined, arrivesInVehicle: boolean, vehiclePlate?: string): string | null {
    const cleanReason = reason?.trim() || "";
    if (!arrivesInVehicle) {
        return cleanReason || null;
    }

    const plate = (vehiclePlate || "").trim().toUpperCase();
    const vehicleMeta = `${VEHICLE_MARKER}:${plate}`;
    if (!cleanReason) return vehicleMeta;
    return `${cleanReason}\n${vehicleMeta}`;
}

function extractVehicleMeta(reason: string | null): { cleanReason: string | null; arrivesInVehicle: boolean; vehiclePlate?: string } {
    if (!reason) return { cleanReason: null, arrivesInVehicle: false };

    const lines = reason.split("\n");
    const markerLine = lines.find((line) => line.startsWith(`${VEHICLE_MARKER}:`));
    if (!markerLine) {
        return { cleanReason: reason, arrivesInVehicle: false };
    }

    const plate = markerLine.replace(`${VEHICLE_MARKER}:`, "").trim();
    const cleanLines = lines.filter((line) => !line.startsWith(`${VEHICLE_MARKER}:`));
    const cleanReason = cleanLines.join("\n").trim();

    return {
        cleanReason: cleanReason || null,
        arrivesInVehicle: true,
        vehiclePlate: plate || undefined,
    };
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        const { searchParams } = new URL(request.url);
        const requestedComplexId = searchParams.get("complexId");
        const unitId = searchParams.get("unitId");
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};
        if (status) where.status = status;

        if (session.user.role === Role.SUPER_ADMIN) {
            if (requestedComplexId) where.complexId = requestedComplexId;
            if (unitId) where.unitId = unitId;
        } else {
            const scope = await resolveUserScope(session.user.id);
            if (!scope?.complexId) {
                return apiError({ code: "FORBIDDEN", message: "Usuario sin complejo asignado" }, 403);
            }

            if (requestedComplexId && requestedComplexId !== scope.complexId) {
                return apiError(
                    { code: "FORBIDDEN", message: "No puedes consultar visitantes de otro complejo" },
                    403
                );
            }

            if (scope.role === Role.RESIDENT) {
                if (!scope.unitId) {
                    return apiError({ code: "FORBIDDEN", message: "Residente sin unidad asignada" }, 403);
                }
                where.unitId = scope.unitId;
            } else {
                where.complexId = scope.complexId;
                if (unitId) where.unitId = unitId;
            }
        }

        const rawLogs = await prisma.visitorLog.findMany({
            where,
            include: {
                unit: { select: { number: true } },
                complex: { select: { name: true } },
                createdBy: { select: { name: true } }
            },
            orderBy: { scheduledDate: "desc" }
        });

        const logs = rawLogs.map((log) => {
            const meta = extractVehicleMeta(log.reason);
            return {
                ...log,
                reason: meta.cleanReason,
                arrivesInVehicle: meta.arrivesInVehicle,
                vehiclePlate: meta.vehiclePlate,
            };
        });

        return apiOk(logs);
    } catch (error) {
        console.error("Error fetching visitors:", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al obtener visitantes" }, 500);
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        const body = await request.json();
        const validatedData = visitorLogSchema.parse(body);

        const unit = await prisma.unit.findUnique({
            where: { id: validatedData.unitId },
            select: { id: true, complexId: true },
        });
        if (!unit) {
            return apiError({ code: "NOT_FOUND", message: "Unidad no encontrada" }, 404);
        }
        if (unit.complexId !== validatedData.complexId) {
            return apiError(
                { code: "VALIDATION_ERROR", message: "La unidad no pertenece al complejo indicado" },
                422
            );
        }

        if (session.user.role !== Role.SUPER_ADMIN) {
            const scope = await resolveUserScope(session.user.id);
            if (!scope?.complexId) {
                return apiError({ code: "FORBIDDEN", message: "Usuario sin complejo asignado" }, 403);
            }

            if (scope.role === Role.RESIDENT) {
                if (scope.unitId !== validatedData.unitId) {
                    return apiError(
                        { code: "FORBIDDEN", message: "Solo puedes registrar visitantes de tu unidad" },
                        403
                    );
                }
            } else if (scope.complexId !== validatedData.complexId) {
                return apiError(
                    { code: "FORBIDDEN", message: "Solo puedes registrar visitantes de tu complejo" },
                    403
                );
            }
        }

        const log = await prisma.visitorLog.create({
            data: {
                visitorName: validatedData.visitorName,
                visitorId: validatedData.visitorId,
                reason: buildReasonWithVehicleMeta(
                    validatedData.reason,
                    validatedData.arrivesInVehicle === true,
                    validatedData.vehiclePlate
                        ? validatedData.vehiclePlate.trim().toUpperCase().replace(/\s+/g, "")
                        : undefined
                ),
                scheduledDate: new Date(validatedData.scheduledDate),
                unitId: validatedData.unitId,
                complexId: validatedData.complexId,
                createdById: session.user.id!,
                status: validatedData.status || "SCHEDULED"
            }
        });

        const logMeta = extractVehicleMeta(log.reason);
        const responseLog = {
            ...log,
            reason: logMeta.cleanReason,
            arrivesInVehicle: logMeta.arrivesInVehicle,
            vehiclePlate: logMeta.vehiclePlate,
        };

        // Notify the resident of the unit
        if (validatedData.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: validatedData.unitId },
                select: { userId: true }
            });

            if (resident && resident.userId !== session.user.id) {
                await sendUserNotification(resident.userId, {
                    title: 'Visitante Programado',
                    body: `Se ha programado una visita para: ${validatedData.visitorName}`,
                    url: '/dashboard/access-control'
                });
            }
        }

        const staffCtx = await loadVisitorNotifyContext(validatedData.complexId, validatedData.unitId);
        const site = visitorStaffSiteLabel(staffCtx);

        // Notify guards and admins of the complex
        await sendComplexNotification(validatedData.complexId, ['GUARD', 'ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
            title: 'Nueva Visita Programada',
            body: `Se ha registrado una visita en ${site}: ${validatedData.visitorName}.`,
            url: '/dashboard/access-control'
        });

        return apiOk(responseLog, 201);
    } catch (error) {
        if (error instanceof ZodError) {
            return apiError(
                { code: "VALIDATION_ERROR", message: "Datos de visitante inválidos", details: error.issues },
                422
            );
        }
        console.error("Error creating visitor log:", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al registrar visitante" }, 500);
    }
}

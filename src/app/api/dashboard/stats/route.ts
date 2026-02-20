import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { role, id: userId } = session.user;

        // Filter by complex if the user is not a SUPER_ADMIN
        // For now, let's assume ADMINs can see stats for all their managed complexes
        // and SUPER_ADMINs see everything.

        const stats = {
            totalComplexes: 0,
            totalUnits: 0,
            totalResidents: 0,
            occupancyRate: 0,
            occupiedByOwner: 0,
            occupiedByTenant: 0,
            vacantUnits: 0,
        };

        if (role === Role.SUPER_ADMIN) {
            stats.totalComplexes = await prisma.complex.count();
            stats.totalUnits = await prisma.unit.count();
            stats.totalResidents = await prisma.resident.count();
        } else if (role === Role.ADMIN || role === Role.BOARD_OF_DIRECTORS) {
            // Get complexes managed by this user (or where they have access)
            const managedComplexes = await prisma.complex.findMany({
                where: { adminId: userId },
                select: { id: true },
            });
            const complexIds = managedComplexes.map((c) => c.id);

            stats.totalComplexes = complexIds.length;
            stats.totalUnits = await prisma.unit.count({
                where: { complexId: { in: complexIds } },
            });
            stats.totalResidents = await prisma.resident.count({
                where: { unit: { complexId: { in: complexIds } } },
            });
        }

        // Calculate detailed occupancy
        const unitStats = await prisma.unit.groupBy({
            by: ['status'],
            _count: true,
            where: {
                ...(role !== Role.SUPER_ADMIN ? {
                    complexId: {
                        in: (await prisma.complex.findMany({
                            where: { adminId: userId },
                            select: { id: true }
                        })).map(c => c.id)
                    }
                } : {}),
            }
        });

        unitStats.forEach(stat => {
            if (stat.status === 'VACANT' || stat.status === 'MAINTENANCE') {
                stats.vacantUnits += stat._count;
            }
        });

        // For owner/tenant breakdown, we query residents
        const residents = await prisma.resident.groupBy({
            by: ['type'],
            _count: true,
            where: {
                unit: {
                    ...(role !== Role.SUPER_ADMIN ? {
                        complexId: {
                            in: (await prisma.complex.findMany({
                                where: { adminId: userId },
                                select: { id: true }
                            })).map(c => c.id)
                        }
                    } : {}),
                }
            }
        });

        residents.forEach(res => {
            if (res.type === 'OWNER') stats.occupiedByOwner = res._count;
            if (res.type === 'TENANT') stats.occupiedByTenant = res._count;
        });

        const totalOccupied = stats.occupiedByOwner + stats.occupiedByTenant;

        // If we have occupied units but no residents (seed case), 
        // fallback to just calling them "tenants" or "occupied" for the chart
        const totalUnitsWithOccupiedStatus = await prisma.unit.count({
            where: {
                status: 'OCCUPIED',
                ...(role !== Role.SUPER_ADMIN ? {
                    complexId: {
                        in: (await prisma.complex.findMany({
                            where: { adminId: userId },
                            select: { id: true }
                        })).map(c => c.id)
                    }
                } : {}),
            }
        });

        if (totalOccupied < totalUnitsWithOccupiedStatus) {
            // Adjust tenants to match unit status if residents are missing
            stats.occupiedByTenant += (totalUnitsWithOccupiedStatus - totalOccupied);
        }

        if (stats.totalUnits > 0) {
            stats.occupancyRate = (totalUnitsWithOccupiedStatus / stats.totalUnits) * 100;
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Error al obtener las estadísticas" },
            { status: 500 }
        );
    }
}

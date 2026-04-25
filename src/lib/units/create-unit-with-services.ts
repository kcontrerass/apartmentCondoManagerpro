import type { Prisma } from "@prisma/client";

type BodyServices = {
  services?: { id: string; quantity?: number }[];
  serviceIds?: string[];
};

export type UnitCreateRow = {
  number: string;
  type?: string | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  area?: number | null;
  status: "OCCUPIED" | "VACANT" | "MAINTENANCE";
};

/**
 * Crea la unidad y asigna servicios obligatorios del complejo + opcionales del body
 * (misma lógica que POST /api/units).
 */
export async function createUnitWithServices(
  tx: Prisma.TransactionClient,
  complexId: string,
  unitRow: UnitCreateRow,
  body: BodyServices
) {
  const createdUnit = await tx.unit.create({
    data: {
      number: unitRow.number,
      type: unitRow.type,
      bedrooms: unitRow.bedrooms,
      bathrooms: unitRow.bathrooms,
      area: unitRow.area,
      status: unitRow.status,
      parkingSpots: unitRow.parkingSpots,
      complexId,
    },
  });

  const mandatoryServicesList = await tx.service.findMany({
    where: {
      complexId,
      isRequired: true,
    },
    select: { id: true },
  });

  const servicesToAssign = new Map<string, number>();
  mandatoryServicesList.forEach((s) => servicesToAssign.set(s.id, 1));

  const bodyServices = (body.services || []) as { id: string; quantity?: number }[];
  bodyServices.forEach((s) => {
    servicesToAssign.set(s.id, s.quantity || 1);
  });

  const bodyServiceIds = (body.serviceIds || []) as string[];
  bodyServiceIds.forEach((id) => {
    if (!servicesToAssign.has(id)) {
      servicesToAssign.set(id, 1);
    }
  });

  if (servicesToAssign.size > 0) {
    await tx.unitService.createMany({
      data: Array.from(servicesToAssign.entries()).map(([serviceId, quantity]) => ({
        unitId: createdUnit.id,
        serviceId,
        quantity,
        status: "ACTIVE" as const,
        startDate: new Date(),
      })),
    });
  }

  return createdUnit;
}

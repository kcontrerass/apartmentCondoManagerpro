import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { unitBatchCreateSchema } from "@/lib/validations/unit";
import { createUnitWithServices } from "@/lib/units/create-unit-with-services";
import { Role } from "@/types/roles";

export const dynamic = "force-dynamic";

function normalizeAndDedupeNumbers(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of raw) {
    const t = n.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (
      session.user.role !== Role.SUPER_ADMIN &&
      session.user.role !== Role.ADMIN &&
      session.user.role !== Role.BOARD_OF_DIRECTORS
    ) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const validated = unitBatchCreateSchema.parse(body);
    const { numbers, complexId, serviceIds, services, ...coreUnit } = validated;
    const bodyForServices = { serviceIds, services };

    if (session.user.role === Role.ADMIN) {
      const complex = await prisma.complex.findFirst({
        where: { id: complexId, adminId: session.user.id },
      });
      if (!complex) {
        return NextResponse.json(
          { error: "No tienes permisos para gestionar unidades en este complejo" },
          { status: 403 }
        );
      }
    } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
      const user = await (prisma as any).user.findUnique({
        where: { id: session.user.id },
        select: { complexId: true },
      });
      if (user?.complexId !== complexId) {
        return NextResponse.json(
          { error: "No tienes permisos para gestionar unidades en este complejo" },
          { status: 403 }
        );
      }
    }

    const normalizedNumbers = normalizeAndDedupeNumbers(numbers);
    if (normalizedNumbers.length === 0) {
      return NextResponse.json(
        { error: "No se indicó ningún número de unidad válido" },
        { status: 400 }
      );
    }

    const existing = await prisma.unit.findMany({
      where: {
        complexId,
        number: { in: normalizedNumbers },
      },
      select: { number: true },
    });
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos números ya existen en este complejo",
          existingNumbers: existing.map((u) => u.number),
        },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const units = [];
      for (const number of normalizedNumbers) {
        const u = await createUnitWithServices(tx, complexId, {
          number,
          type: coreUnit.type,
          bedrooms: coreUnit.bedrooms,
          bathrooms: coreUnit.bathrooms,
          parkingSpots: coreUnit.parkingSpots,
          area: coreUnit.area,
          status: coreUnit.status,
        }, bodyForServices);
        units.push(u);
      }
      return units;
    });

    return NextResponse.json(
      { created, count: created.length },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating units batch:", error);
    return NextResponse.json(
      { error: "Error al crear las unidades" },
      { status: 500 }
    );
  }
}

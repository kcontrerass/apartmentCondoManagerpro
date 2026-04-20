import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const SEARCH_MAX_LEN = 200;

/** Cache por proceso: columnas opcionales que a veces faltan si no se aplicó toda la migración. */
const columnExistsCache = new Map<string, boolean>();

async function residentsColumnExists(columnName: string): Promise<boolean> {
    const key = `residents.${columnName}`;
    const hit = columnExistsCache.get(key);
    if (hit !== undefined) return hit;

    try {
        const rows = await prisma.$queryRaw<{ c: bigint }[]>`
            SELECT COUNT(*) AS c
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'residents'
              AND COLUMN_NAME = ${columnName}
        `;
        const ok = Number(rows[0]?.c ?? 0) > 0;
        columnExistsCache.set(key, ok);
        return ok;
    } catch {
        columnExistsCache.set(key, false);
        return false;
    }
}

/**
 * IDs de residentes que cumplen filtros + texto en columnas relacionadas (MySQL LOCATE, collation CI).
 */
export async function findResidentIdsByTextSearch(opts: {
    search: string;
    isAirbnbOnly: boolean;
    complexId: string | null;
    unitId: string | null;
    userIdFilter: string | null;
}): Promise<string[]> {
    const q = opts.search.trim().slice(0, SEARCH_MAX_LEN);
    if (!q) return [];

    const hasIdentification = await residentsColumnExists("airbnb_guest_identification");

    const textOr = [
        Prisma.sql`LOCATE(${q}, u.name) > 0`,
        Prisma.sql`LOCATE(${q}, IFNULL(u.email, '')) > 0`,
        Prisma.sql`LOCATE(${q}, IFNULL(u.phone, '')) > 0`,
        Prisma.sql`LOCATE(${q}, un.number) > 0`,
        Prisma.sql`LOCATE(${q}, c.name) > 0`,
        Prisma.sql`LOCATE(${q}, IFNULL(r.airbnb_guest_name, '')) > 0`,
        Prisma.sql`LOCATE(${q}, IFNULL(r.airbnb_reservation_code, '')) > 0`,
        Prisma.sql`LOCATE(${q}, IFNULL(r.airbnb_guest_phone, '')) > 0`,
    ];
    if (hasIdentification) {
        textOr.push(Prisma.sql`LOCATE(${q}, IFNULL(r.airbnb_guest_identification, '')) > 0`);
    }

    // Sin DISTINCT: cada residente es una fila (JOINs 1:1). DISTINCT + ORDER BY createdAt rompe en MySQL ONLY_FULL_GROUP_BY.
    const idRows = await prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`
            SELECT r.id
            FROM residents r
            INNER JOIN users u ON u.id = r.user_id
            INNER JOIN units un ON un.id = r.unit_id
            INNER JOIN complexes c ON c.id = un.complex_id
            WHERE 1 = 1
            ${opts.isAirbnbOnly ? Prisma.sql`AND r.is_airbnb = 1` : Prisma.empty}
            ${opts.unitId ? Prisma.sql`AND r.unit_id = ${opts.unitId}` : Prisma.empty}
            ${opts.userIdFilter ? Prisma.sql`AND r.user_id = ${opts.userIdFilter}` : Prisma.empty}
            ${opts.complexId ? Prisma.sql`AND un.complex_id = ${opts.complexId}` : Prisma.empty}
            AND (${Prisma.join(textOr, " OR ")})
            ORDER BY r.createdAt DESC
        `
    );

    return idRows.map((row) => row.id);
}

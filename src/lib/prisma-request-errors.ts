import { Prisma } from "@prisma/client";

/** Tabla ausente (migración no aplicada). Prisma suele usar P2021 y el texto "The table … does not exist". */
export function isPrismaTableMissingError(error: unknown, tableName: string): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        return false;
    }
    const msg = typeof error.message === "string" ? error.message : "";
    if (!msg.includes(tableName) || !/does not exist/i.test(msg)) {
        return false;
    }
    return error.code === "P2021" || /the table/i.test(msg);
}

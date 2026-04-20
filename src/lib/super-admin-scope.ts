import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/** Cookie usada solo para filtrar la vista de cobros / facturas (súper admin). */
export const SUPER_ADMIN_BILLING_SCOPE_COOKIE = "super_admin_billing_complex_id";

/** Nombre anterior; se borra al guardar el nuevo alcance. */
export const LEGACY_SUPER_ADMIN_SCOPE_COOKIE = "super_admin_scope_complex_id";

function readBillingScopeRaw(cookieStore: { get: (name: string) => { value?: string } | undefined }): string | undefined {
    return (
        cookieStore.get(SUPER_ADMIN_BILLING_SCOPE_COOKIE)?.value?.trim() ||
        cookieStore.get(LEGACY_SUPER_ADMIN_SCOPE_COOKIE)?.value?.trim()
    );
}

export async function getSuperAdminBillingScopeComplexIdFromCookies(): Promise<string | null> {
    const raw = readBillingScopeRaw(await cookies());
    if (!raw) return null;
    const ok = await prisma.complex.findUnique({ where: { id: raw }, select: { id: true } });
    return ok ? raw : null;
}

/** Prioriza ?complexId=; si no hay, usa la cookie de cobros. */
export async function getSuperAdminBillingScopeComplexIdFromRequest(request: Request): Promise<string | null> {
    const url = new URL(request.url);
    const q = url.searchParams.get("complexId")?.trim();
    if (q) {
        const ok = await prisma.complex.findUnique({ where: { id: q }, select: { id: true } });
        return ok ? q : null;
    }
    return getSuperAdminBillingScopeComplexIdFromCookies();
}

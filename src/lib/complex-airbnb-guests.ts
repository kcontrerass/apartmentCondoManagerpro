import { Role } from "@/types/roles";

type ComplexSettings = {
    airbnbGuestsEnabled?: boolean;
    permissions?: Partial<Record<string, Record<string, boolean>>>;
};

/** Historial: si existía `airbnbGuestsEnabled: false`, todo el complejo quedaba sin huéspedes. */
function legacyAirbnbGloballyOff(settings: ComplexSettings | null | undefined): boolean {
    return settings?.airbnbGuestsEnabled === false;
}

/**
 * Listado / pantalla Huéspedes Airbnb para administración, junta y seguridad.
 * Requiere módulo Residentes y permiso airbnbGuests para ese rol.
 */
export function roleCanAccessAirbnbStaffRoutes(settings: unknown, role: Role): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    const s = settings as ComplexSettings | undefined;
    if (!s || legacyAirbnbGloballyOff(s)) return false;
    const p = s.permissions?.[role];
    if (!p) return true;
    if (p.residents === false) return false;
    if (p.airbnbGuests === false) return false;
    return true;
}

/** Registro desde perfil del residente y PATCH /api/residents/me/airbnb */
export function roleCanResidentUseAirbnbSelfService(settings: unknown): boolean {
    const s = settings as ComplexSettings | undefined;
    if (!s || legacyAirbnbGloballyOff(s)) return false;
    const p = s.permissions?.[Role.RESIDENT];
    if (!p) return true;
    return p.airbnbGuests !== false;
}

/** Crear/editar datos Airbnb en residentes (admin / junta). */
export function roleCanStaffManageResidentAirbnbFields(settings: unknown, role: Role): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    if (role !== Role.ADMIN && role !== Role.BOARD_OF_DIRECTORS) return false;
    return roleCanAccessAirbnbStaffRoutes(settings, role);
}

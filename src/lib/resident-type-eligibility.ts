/**
 * Decide si una unidad puede tener residentes tipo huésped Airbnb / estadías tipo Airbnb,
 * según el tipo de complejo y el tipo de unidad (uso mixto: locales vs vivienda).
 */

/** Tipos de unidad tratados como no residenciales para huésped Airbnb */
const COMMERCIAL_UNIT_TYPES = new Set([
    "local comercial",
    "local",
    "oficina",
    "clínica",
    "clinica",
]);

function normalizeUnitType(unitType: string | null | undefined): string {
    return String(unitType ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "");
}

/**
 * @returns false si el complejo/unidad no admiten AIRBNB_GUEST (ej. centro comercial o local/oficina).
 */
export function unitAllowsAirbnbGuestResident(
    complexType: string | null | undefined,
    unitType: string | null | undefined,
): boolean {
    const ct = String(complexType ?? "").trim();
    if (ct === "SHOPPING_CENTER") {
        return false;
    }

    const key = normalizeUnitType(unitType);
    if (!key) return true;

    if (COMMERCIAL_UNIT_TYPES.has(key)) {
        return false;
    }

    return true;
}

/** Estado Airbnb esperado tras aplicar un PATCH parcial al residente actual. */
export function inferAirbnbIntentAfterPatch(
    resident: { type: string; isAirbnb: boolean },
    patch: { type?: string; isAirbnb?: boolean },
): boolean {
    const nextType = patch.type !== undefined ? patch.type : resident.type;

    let nextIsAirbnb =
        patch.isAirbnb !== undefined ? patch.isAirbnb : resident.isAirbnb;

    if (patch.type === "AIRBNB_GUEST") {
        nextIsAirbnb = true;
    }

    if (
        patch.type !== undefined &&
        patch.type !== "AIRBNB_GUEST" &&
        resident.type === "AIRBNB_GUEST"
    ) {
        nextIsAirbnb = false;
    }

    return nextType === "AIRBNB_GUEST" || nextIsAirbnb === true;
}

/**
 * Vista Huéspedes Airbnb en gestión (sidebar /dashboard/airbnb-guests): no aplica a centro comercial.
 * SUPER_ADMIN puede usarla para ver registros en otros complejos.
 */
export function staffAirbnbGuestsModuleAllowed(
    complexType: string | null | undefined,
    userRole: string | undefined,
): boolean {
    if (userRole === "SUPER_ADMIN") return true;
    return String(complexType ?? "").trim() !== "SHOPPING_CENTER";
}

import { AmenityType } from "@prisma/client";

/** Tipos típicos en condominios / residencial */
export const RESIDENTIAL_AMENITY_TYPES: readonly AmenityType[] = [
    AmenityType.POOL,
    AmenityType.GYM,
    AmenityType.CLUBHOUSE,
    AmenityType.COURT,
    AmenityType.BBQ,
    AmenityType.OTHER,
];

/** Tipos orientados a centro comercial */
export const SHOPPING_CENTER_AMENITY_TYPES: readonly AmenityType[] = [
    AmenityType.FOOD_COURT,
    AmenityType.EVENT_SPACE,
    AmenityType.VISITOR_PARKING,
    AmenityType.LOADING_AREA,
    AmenityType.MULTIPURPOSE_HALL,
    AmenityType.PLAY_AREA,
    AmenityType.OTHER,
];

export function amenityTypesForComplex(complexType: string | null | undefined): AmenityType[] {
    const ct = String(complexType ?? "").trim();
    if (ct === "SHOPPING_CENTER") {
        return [...SHOPPING_CENTER_AMENITY_TYPES];
    }
    return [...RESIDENTIAL_AMENITY_TYPES];
}

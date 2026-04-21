/**
 * Imagen del panel hero en login / flujos de autenticación.
 *
 * Por defecto: Ciudad de Guatemala (paisaje urbano con horizonte volcánico), Unsplash — By Topo.
 * Licencia Unsplash: https://unsplash.com/license
 *
 * - Alineación con landing: sustituir por la misma referencia o /public/auth-hero.jpg cuando diseño lo confirme.
 * - Override: NEXT_PUBLIC_AUTH_HERO_IMAGE_URL.
 */
export const AUTH_HERO_IMAGE_DEFAULT =
    "https://images.unsplash.com/photo-1722304358431-4fb44b829f76?q=80&w=2070&auto=format&fit=crop";

export function getAuthHeroImageUrl(): string {
    const fromEnv =
        typeof process !== "undefined" ? process.env.NEXT_PUBLIC_AUTH_HERO_IMAGE_URL?.trim() : "";
    if (fromEnv) return fromEnv;
    return AUTH_HERO_IMAGE_DEFAULT;
}

import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

/** Imports estáticos: evita caché obsoleta de Turbopack con `import(\`./${locale}.json\`)` y nuevas claves. */
const messagesByLocale: Record<(typeof routing.locales)[number], typeof es> = {
    es,
    en,
};

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
        locale = routing.defaultLocale;
    }

    const messages =
        messagesByLocale[locale as (typeof routing.locales)[number]] ??
        messagesByLocale[routing.defaultLocale];

    return {
        locale: locale as string,
        messages,
    };
});

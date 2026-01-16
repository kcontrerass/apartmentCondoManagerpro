import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    try {
        return {
            locale: locale as string,
            messages: (await import(`@/messages/${locale}.json`)).default
        };
    } catch (error) {
        console.error(`Error loading messages for locale ${locale}:`, error);
        return {
            locale: routing.defaultLocale,
            messages: (await import(`@/messages/${routing.defaultLocale}.json`)).default
        };
    }
});

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PLATFORM_SUBSCRIPTION_TERMS_VERSION } from "@/lib/platform-subscription-terms";

type Props = { params: Promise<{ locale: string }> };

export default async function PlatformTermsPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PlatformLegalDocs" });
    const paragraphs = t("termsBody")
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
                <Link
                    href={`/${locale}/dashboard/platform-subscription`}
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    {t("backToSubscription")}
                </Link>
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">{t("termsTitle")}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("termsUpdated", { version: PLATFORM_SUBSCRIPTION_TERMS_VERSION })}
                    </p>
                </header>
                <article className="prose prose-slate dark:prose-invert prose-sm max-w-none space-y-4">
                    {paragraphs.map((p, i) => (
                        <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-300">
                            {p}
                        </p>
                    ))}
                </article>
            </div>
        </div>
    );
}

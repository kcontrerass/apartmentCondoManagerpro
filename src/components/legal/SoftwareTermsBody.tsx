import { SOFTWARE_TERMS_DOC_TITLE, SOFTWARE_TERMS_META_LINES, SOFTWARE_TERMS_PREAMBLE, SOFTWARE_TERMS_SECTIONS } from '@/content/software-terms-document';

function splitBlocks(body: string): string[] {
    return body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
}

type Props = {
    pageTitle: string;
    versionLine: string;
    langNotice?: string | null;
};

/**
 * Texto legal único: Términos y Política de datos ADESSO-365 (contenido en `software-terms-document.ts`).
 */
export function SoftwareTermsBody({ pageTitle, versionLine, langNotice }: Props) {
    return (
        <>
            {langNotice ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 bg-white/60 dark:bg-slate-800/40">
                    {langNotice}
                </p>
            ) : null}

            <header className="space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{pageTitle}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{versionLine}</p>
            </header>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/30 px-4 py-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white mb-2">{SOFTWARE_TERMS_DOC_TITLE}</p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 mb-4 list-none">
                    {SOFTWARE_TERMS_META_LINES.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
                <p className="text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-white/10 pt-4">
                    {SOFTWARE_TERMS_PREAMBLE}
                </p>
            </div>

            <article className="space-y-10 pb-16">
                {SOFTWARE_TERMS_SECTIONS.map((section) => (
                    <section key={section.id} className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {section.id}. {section.title}
                        </h2>
                        <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {splitBlocks(section.body).map((block, i) => (
                                <p key={i} className="whitespace-pre-line">
                                    {block}
                                </p>
                            ))}
                        </div>
                    </section>
                ))}
            </article>
        </>
    );
}

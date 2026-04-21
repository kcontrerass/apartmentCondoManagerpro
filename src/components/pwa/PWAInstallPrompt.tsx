"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

/** Strings resolved in a Server Component via `getTranslations` so this client tree does not depend on `NextIntlClientProvider` during SSR/recovery. */
export type PWAInstallCopy = {
    title: string;
    subtitle: string;
    benefit1: string;
    benefit2: string;
    benefit3: string;
    install: string;
    installing: string;
    later: string;
    dismiss: string;
    waitingPrompt: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt({ copy }: { copy: PWAInstallCopy }) {
  const t = (key: keyof PWAInstallCopy) => copy[key];
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [supportsInstall, setSupportsInstall] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setSupportsInstall("serviceWorker" in navigator);

    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    if (dismissed || standalone) return;

    // Show the banner even if beforeinstallprompt doesn't fire yet
    // (e.g. first visits, iOS, or browsers that rely on manual install menu).
    setIsVisible(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const onInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.message(t("waitingPrompt"));
      return;
    }
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible || isStandalone || !supportsInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(92vw,420px)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("title")}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label={t("dismiss")}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
        <li>{t("benefit1")}</li>
        <li>{t("benefit2")}</li>
        <li>{t("benefit3")}</li>
      </ul>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex-1"
        >
          {isInstalling ? t("installing") : t("install")}
        </Button>
        <Button variant="ghost" onClick={handleDismiss}>
          {t("later")}
        </Button>
      </div>
      {!deferredPrompt ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t("waitingPrompt")}
        </p>
      ) : null}
    </div>
  );
}

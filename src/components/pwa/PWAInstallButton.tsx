"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallButton() {
  const t = useTranslations("Settings");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isNativeInstallAvailable, setIsNativeInstallAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsNativeInstallAvailable(true);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsNativeInstallAvailable(false);
      toast.success(t("pwaInstalled", { default: "App instalada correctamente." }));
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [t]);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.message(t("pwaManualHelp", { default: "Abre el menú del navegador y elige Instalar app / Añadir a pantalla de inicio." }));
      return;
    }
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch sm:items-center gap-1">
      <Button onClick={handleInstall} variant="secondary" className="shrink-0 h-[42px]" disabled={isInstalling}>
        <span className="material-symbols-outlined mr-2">download</span>
        {isInstalling
          ? t("pwaInstalling", { default: "Instalando..." })
          : t("pwaInstallButton", { default: "Instalar app" })}
      </Button>
      <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 text-left sm:text-right">
        {isNativeInstallAvailable
          ? t("pwaStatusDirect", { default: "Instalacion directa disponible desde este boton." })
          : t("pwaStatusManual", { default: "Si no se abre instalacion, usa el menu del navegador." })}
      </p>
    </div>
  );
}

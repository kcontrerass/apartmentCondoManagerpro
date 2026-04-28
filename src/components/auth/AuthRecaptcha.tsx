'use client';

import ReCAPTCHA from 'react-google-recaptcha';
import { useEffect, useRef, useState } from 'react';

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

type AuthRecaptchaProps = {
    /** Increment after each form attempt to obtain a fresh challenge. */
    resetSignal?: number;
    /** Called when the user completes, clears, or errors the widget (empty string = not ready). */
    onTokenChange?: (token: string) => void;
};

export function isRecaptchaWidgetEnabled(): boolean {
    return Boolean(siteKey);
}

/**
 * Google reCAPTCHA v2 (checkbox): envía `recaptchaToken` con el formulario.
 * El servidor valida con `RECAPTCHA_SECRET_KEY`.
 * Sin variables de entorno, no renderiza nada y el servidor no exige CAPTCHA.
 */
export function AuthRecaptcha({ resetSignal = 0, onTokenChange }: AuthRecaptchaProps) {
    const ref = useRef<ReCAPTCHA>(null);
    const onTokenChangeRef = useRef(onTokenChange);
    onTokenChangeRef.current = onTokenChange;
    const [token, setToken] = useState('');
    const enabled = Boolean(siteKey);

    const pushToken = (t: string | null) => {
        const s = t ?? '';
        setToken(s);
        onTokenChangeRef.current?.(s);
    };

    useEffect(() => {
        if (resetSignal > 0) {
            setToken('');
            onTokenChangeRef.current?.('');
            ref.current?.reset();
        }
    }, [resetSignal]);

    if (!enabled) return null;

    return (
        <>
            <input type="hidden" name="recaptchaToken" value={token} readOnly />
            <div className="flex justify-center min-h-[78px]">
                <ReCAPTCHA
                    ref={ref}
                    sitekey={siteKey}
                    onChange={pushToken}
                    onExpired={() => pushToken(null)}
                    onErrored={() => pushToken(null)}
                    theme="light"
                />
            </div>
        </>
    );
}

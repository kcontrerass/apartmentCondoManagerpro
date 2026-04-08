import { createHmac, timingSafeEqual } from "crypto";

export interface RecurrenteKeys {
    publicKey: string;
    secretKey: string;
    webhookSecret?: string;
}

const BASE_URL = 'https://app.recurrente.com/api';

export const recurrente = {
    checkouts: {
        create: async (data: {
            items: {
                name: string;
                currency?: string;
                amount_in_cents: number;
                quantity?: number;
            }[];
            success_url?: string;
            cancel_url?: string;
            metadata?: Record<string, unknown>;
            [key: string]: unknown;
        }, keys?: RecurrenteKeys) => {
            try {
                const pubKey = keys?.publicKey;
                const secKey = keys?.secretKey;

                if (!pubKey || !secKey) throw new Error("Missing Recurrente API Keys check complex settings");

                const requestHeaders = {
                    'Content-Type': 'application/json',
                    'X-PUBLIC-KEY': pubKey,
                    'X-SECRET-KEY': secKey,
                };

                const response = await fetch(`${BASE_URL}/checkouts`, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error: unknown) {
                console.error('Error creating Recurrente checkout:', error);
                throw error;
            }
        },
        retrieve: async (id: string, keys?: RecurrenteKeys) => {
            try {
                const pubKey = keys?.publicKey || '';
                const secKey = keys?.secretKey || '';

                if (!pubKey || !secKey) {
                    return null;
                }

                const response = await fetch(`${BASE_URL}/checkouts/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-PUBLIC-KEY': pubKey,
                        'X-SECRET-KEY': secKey,
                    },
                });

                if (!response.ok) {
                    // Return null if not found or error, let caller handle
                    return null;
                }

                return await response.json();
            } catch (error: unknown) {
                console.error('Error retrieving Recurrente checkout:', error);
                throw error;
            }
        }
    },
    webhooks: {
        verifySignature: (params: {
            rawBody: string;
            signatureHeader: string | null;
            timestampHeader?: string | null;
            toleranceSeconds?: number;
            keys?: RecurrenteKeys;
        }): boolean => {
            const secret = params.keys?.webhookSecret;
            if (!secret) return false;

            const { rawBody, signatureHeader, timestampHeader, toleranceSeconds = 300 } = params;
            if (!signatureHeader) return false;

            const parsed: Record<string, string> = {};
            for (const chunk of signatureHeader.split(",")) {
                const [k, ...rest] = chunk.split("=");
                if (!k || rest.length === 0) continue;
                parsed[k.trim().toLowerCase()] = rest.join("=").trim();
            }

            const providedCandidates = [
                parsed.v1,
                parsed.signature,
                signatureHeader.trim(),
            ].filter(Boolean) as string[];

            const timestampRaw = parsed.t || parsed.timestamp || timestampHeader || "";
            const timestamp = Number(timestampRaw);
            const hasTimestamp = Number.isFinite(timestamp) && timestamp > 0;

            if (hasTimestamp) {
                const nowSeconds = Math.floor(Date.now() / 1000);
                if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
                    return false;
                }
            }

            const payloadWithTimestamp = hasTimestamp ? `${timestamp}.${rawBody}` : rawBody;
            const digestHexWithTimestamp = createHmac("sha256", secret)
                .update(payloadWithTimestamp)
                .digest("hex");
            const digestHexRaw = createHmac("sha256", secret)
                .update(rawBody)
                .digest("hex");
            const digestBase64WithTimestamp = createHmac("sha256", secret)
                .update(payloadWithTimestamp)
                .digest("base64");
            const digestBase64Raw = createHmac("sha256", secret)
                .update(rawBody)
                .digest("base64");

            const expectedCandidates = [
                digestHexWithTimestamp,
                digestHexRaw,
                digestBase64WithTimestamp,
                digestBase64Raw,
            ];

            for (const provided of providedCandidates) {
                for (const expected of expectedCandidates) {
                    const providedBuf = Buffer.from(provided, "utf8");
                    const expectedBuf = Buffer.from(expected, "utf8");
                    if (providedBuf.length !== expectedBuf.length) continue;
                    if (timingSafeEqual(providedBuf, expectedBuf)) {
                        return true;
                    }
                }
            }

            return false;
        }
    }
};

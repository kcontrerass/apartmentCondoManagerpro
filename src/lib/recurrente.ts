const RECURRENTE_PUBLIC_KEY = process.env.RECURRENTE_PUBLIC_KEY;
const RECURRENTE_SECRET_KEY = process.env.RECURRENTE_SECRET_KEY;

if (!RECURRENTE_PUBLIC_KEY || !RECURRENTE_SECRET_KEY) {
    console.error('RECURRENTE_PUBLIC_KEY or RECURRENTE_SECRET_KEY is missing');
} else {
    console.log('Recurrente Keys loaded:', {
        publicKeyLength: RECURRENTE_PUBLIC_KEY.length,
        secretKeyLength: RECURRENTE_SECRET_KEY.length,
        publicPrefix: RECURRENTE_PUBLIC_KEY.substring(0, 4) + '...',
        secretPrefix: RECURRENTE_SECRET_KEY.substring(0, 4) + '...'
    });
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
            metadata?: Record<string, any>;
            [key: string]: any;
        }) => {
            try {
                const requestHeaders = {
                    'Content-Type': 'application/json',
                    'X-PUBLIC-KEY': (RECURRENTE_PUBLIC_KEY || '').trim(),
                    'X-SECRET-KEY': (RECURRENTE_SECRET_KEY || '').trim(),
                };

                console.log('Sending Recurrente Request:', {
                    url: `${BASE_URL}/checkouts`,
                    headers: {
                        ...requestHeaders,
                        'X-PUBLIC-KEY': requestHeaders['X-PUBLIC-KEY'].substring(0, 5) + '...' + requestHeaders['X-PUBLIC-KEY'].slice(-3),
                        'X-SECRET-KEY': requestHeaders['X-SECRET-KEY'].substring(0, 5) + '...' + requestHeaders['X-SECRET-KEY'].slice(-3),
                    }
                });

                const response = await fetch(`${BASE_URL}/checkouts`, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                console.log(responseData)
                console.log('Recurrente Response:', JSON.stringify(responseData, null, 2));
                return responseData;
            } catch (error: any) {
                console.error('Error creating Recurrente checkout:', error);
                throw error;
            }
        },
        retrieve: async (id: string) => {
            try {
                console.log(`[Recurrente] Retrieving checkout from: ${BASE_URL}/checkouts/${id}`);
                const response = await fetch(`${BASE_URL}/checkouts/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-PUBLIC-KEY': RECURRENTE_PUBLIC_KEY || '',
                        'X-SECRET-KEY': RECURRENTE_SECRET_KEY || '',
                    },
                });

                if (!response.ok) {
                    // Return null if not found or error, let caller handle
                    return null;
                }

                return await response.json();
            } catch (error: any) {
                console.error('Error retrieving Recurrente checkout:', error);
                throw error;
            }
        }
    },
    webhooks: {
        verifySignature: (signature: string | null, secret: string) => {
            // Placeholder for verification logic
            return true;
        }
    }
};

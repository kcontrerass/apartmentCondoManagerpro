import { ReservationInput, UpdateReservationInput } from '@/lib/validations/reservation';

const API_BASE = '/api/reservations';

export async function getReservations(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}${query}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`Fetch failed with status ${res.status}:`, errorData);
        throw new Error(errorData.error || 'Failed to fetch reservations');
    }
    return res.json();
}

export async function getReservation(id: string) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch reservation');
    return res.json();
}

export async function createReservation(data: ReservationInput) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create reservation');
    }
    return res.json();
}

export async function updateReservation(id: string, data: UpdateReservationInput) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update reservation');
    }
    return res.json();
}

export async function deleteReservation(id: string) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete reservation');
    return res.json();
}

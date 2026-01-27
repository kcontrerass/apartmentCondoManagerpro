export async function getAmenities(complexId?: string) {
    const query = complexId ? `?complexId=${complexId}` : '';
    const res = await fetch(`/api/amenities${query}`);
    if (!res.ok) throw new Error('Failed to fetch amenities');
    return res.json();
}

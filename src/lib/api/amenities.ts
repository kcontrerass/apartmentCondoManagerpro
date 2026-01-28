export async function getAmenities(complexId?: string) {
    const query = complexId ? `?complexId=${complexId}` : '';
    const res = await fetch(`/api/amenities${query}`);
    if (!res.ok) throw new Error('Failed to fetch amenities');
    return res.json();
}
export async function getAmenity(id: string) {
    const res = await fetch(`/api/amenities/${id}`);
    if (!res.ok) throw new Error('Failed to fetch amenity');
    return res.json();
}

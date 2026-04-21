"use client";

import { useState, useEffect, useCallback } from "react";
import { Complex, ComplexType } from "@prisma/client";

export interface ComplexWithCount extends Complex {
    _count: {
        units: number;
        amenities: number;
    };
    /** Solo en listados de súper admin (JSON puede serializar fechas como string) */
    platformSubscriptionPastDue?: boolean;
}

function readFetchErrorMessage(data: unknown, status: number): string {
    if (data && typeof data === "object") {
        const o = data as Record<string, unknown>;
        if (typeof o.error === "string") return o.error;
        if (o.error && typeof o.error === "object") {
            const inner = o.error as Record<string, unknown>;
            if (typeof inner.message === "string") return inner.message;
        }
        if (typeof o.detail === "string") return o.detail;
        if (typeof o.message === "string") return o.message;
    }
    return `HTTP ${status}`;
}

export function useComplexes() {
    const [complexes, setComplexes] = useState<ComplexWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComplexes = useCallback(async (search = "", type = "") => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (search) query.append("search", search);
            if (type) query.append("type", type);

            const response = await fetch(`/api/complexes?${query.toString()}`);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(readFetchErrorMessage(data, response.status));
            }

            if (!Array.isArray(data)) {
                throw new Error("Respuesta inválida del servidor");
            }

            setComplexes(data);
            setError(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error al cargar los complejos";
            setError(msg || "Error al cargar los complejos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteComplex = async (id: string) => {
        try {
            const response = await fetch(`/api/complexes/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete complex");

            setComplexes((prev) => prev.filter((c) => c.id !== id));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    useEffect(() => {
        fetchComplexes();
    }, [fetchComplexes]);

    return {
        complexes,
        loading,
        error,
        fetchComplexes,
        deleteComplex,
    };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Complex, ComplexType } from "@prisma/client";

interface ComplexWithCount extends Complex {
    _count: {
        units: number;
        amenities: number;
    };
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
            if (!response.ok) throw new Error("Failed to fetch complexes");

            const data = await response.json();
            setComplexes(data);
            setError(null);
        } catch (err) {
            setError("Error al cargar los complejos");
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

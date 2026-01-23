"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ComplexTable } from "@/components/complexes/ComplexTable";
import { useComplexes } from "@/hooks/useComplexes";
import { useState } from "react";
import { ComplexType } from "@prisma/client";

interface ComplexesClientProps {
    userRole?: string;
}

export function ComplexesClient({ userRole }: ComplexesClientProps) {
    const { complexes, loading, deleteComplex, fetchComplexes } = useComplexes();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar este complejo?")) {
            await deleteComplex(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Buscar
                    </label>
                    <Input
                        placeholder="Nombre o dirección..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchComplexes(search, type)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo
                    </label>
                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={[
                            { label: "Todos los tipos", value: "" },
                            { label: "Edificio", value: ComplexType.BUILDING },
                            { label: "Residencial", value: ComplexType.RESIDENTIAL },
                            { label: "Condominio", value: ComplexType.CONDO },
                        ]}
                    />
                </div>
                <Button variant="secondary" onClick={() => fetchComplexes(search, type)}>
                    Filtrar
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <ComplexTable complexes={complexes} onDelete={handleDelete} userRole={userRole} />
            )}
        </div>
    );
}

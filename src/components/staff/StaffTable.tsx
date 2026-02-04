"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Role, UserStatus } from "@prisma/client";

interface StaffUser {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: Role;
    status: UserStatus;
    assignedComplex?: {
        name: string;
    } | null;
}

interface StaffTableProps {
    staff: StaffUser[];
    onEdit: (user: StaffUser) => void;
    onDelete: (user: StaffUser) => void;
    currentUserRole: Role;
}

export const StaffTable = ({ staff, onEdit, onDelete, currentUserRole }: StaffTableProps) => {
    const t = useTranslations("common"); // Or 'Staff' if namespace exists

    const getRoleBadgeVariant = (role: Role) => {
        switch (role) {
            case Role.SUPER_ADMIN: return "info";
            case Role.ADMIN: return "info";
            case Role.GUARD: return "warning";
            case Role.OPERATOR: return "success"; // Or 'neutral'
            default: return "neutral";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Nombre</th>
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Email</th>
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Teléfono</th>
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Rol</th>
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Estado</th>
                        {currentUserRole === Role.SUPER_ADMIN && (
                            <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white">Complejo</th>
                        )}
                        <th className="py-4 px-4 font-semibold text-slate-900 dark:text-white text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {staff.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 px-4">
                                <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                {user.email}
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                {user.phone || '-'}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                    {user.role}
                                </Badge>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={user.status === UserStatus.ACTIVE ? "success" : "error"}>
                                    {user.status}
                                </Badge>
                            </td>
                            {currentUserRole === Role.SUPER_ADMIN && (
                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                    {user.assignedComplex?.name || '-'}
                                </td>
                            )}
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="p-2 text-slate-500 hover:text-red-600 transition-colors"
                                        title="Eliminar / Desactivar"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {staff.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                                No hay personal registrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

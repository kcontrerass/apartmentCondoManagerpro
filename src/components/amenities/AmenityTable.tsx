"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Amenity {
    id: string;
    name: string;
    type: string;
    capacity: number | null;
    costPerDay: any;
    costPerHour: any;
    complex?: { name: string };
}

interface AmenityTableProps {
    amenities: Amenity[];
    onEdit: (amenity: Amenity) => void;
    onDelete: (id: string) => void;
    onBook?: (id: string) => void;
    isAdmin?: boolean;
}

export function AmenityTable({ amenities, onEdit, onDelete, onBook, isAdmin = true }: AmenityTableProps) {
    const t = useTranslations('Amenities');
    const tRes = useTranslations('Reservations');
    const tCommon = useTranslations('Common');

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "POOL": return "info";
            case "GYM": return "neutral";
            case "COURT": return "success";
            case "CLUBHOUSE": return "warning";
            case "BBQ": return "neutral";
            default: return "neutral";
        }
    };

    if (amenities.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                {t('noAmenities')}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{t('table.name')}</th>
                        <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{t('table.type')}</th>
                        <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{t('table.complex')}</th>
                        <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{t('table.capacity')}</th>
                        <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300 text-right">{tCommon('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {amenities.map((amenity) => (
                        <tr key={amenity.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4">
                                <span className="font-medium text-slate-900 dark:text-white">{amenity.name}</span>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getTypeBadgeVariant(amenity.type)}>
                                    {t(`types.${amenity.type}`)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                {amenity.complex?.name || "-"}
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                {amenity.capacity || "-"}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {onBook && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => onBook(amenity.id)}
                                        >
                                            {tRes('book')}
                                        </Button>
                                    )}
                                    {isAdmin && (
                                        <>
                                            <Button variant="secondary" size="sm" icon="edit" onClick={() => onEdit(amenity)} />
                                            <Button variant="danger" size="sm" icon="delete" onClick={() => onDelete(amenity.id)} />
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

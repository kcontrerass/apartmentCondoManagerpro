import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string) {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Q${value.toFixed(2)}`;
}

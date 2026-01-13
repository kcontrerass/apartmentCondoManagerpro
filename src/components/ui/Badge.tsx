import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "success" | "warning" | "error" | "info" | "neutral";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "neutral", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    {
                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400": variant === "success",
                        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400": variant === "warning",
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400": variant === "error",
                        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400": variant === "info",
                        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300": variant === "neutral",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };

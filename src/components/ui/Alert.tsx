import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "info" | "success" | "warning" | "error";
    title?: string;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "info", title, children, ...props }, ref) => {
        const icons = {
            info: "info",
            success: "check_circle",
            warning: "warning",
            error: "error",
        };

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(
                    "relative w-full rounded-lg border p-4 flex gap-3 items-start",
                    {
                        "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900": variant === "info",
                        "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900": variant === "success",
                        "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-900": variant === "warning",
                        "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900": variant === "error",
                    },
                    className
                )}
                {...props}
            >
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">
                    {icons[variant]}
                </span>
                <div className="flex-1">
                    {title && <h5 className="font-medium mb-1 leading-none tracking-tight">{title}</h5>}
                    <div className="text-sm opacity-90">{children}</div>
                </div>
            </div>
        );
    }
);
Alert.displayName = "Alert";

export { Alert };

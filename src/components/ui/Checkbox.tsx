import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <label className="inline-flex items-center space-x-2 cursor-pointer group">
                <input
                    type="checkbox"
                    className={cn(
                        "peer h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {label && (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                        {label}
                    </span>
                )}
            </label>
        );
    }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

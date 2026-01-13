import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function Avatar({
    src,
    alt = "User Avatar",
    fallback = "U",
    size = "md",
    className
}: AvatarProps) {

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg"
    };

    return (
        <div
            className={cn(
                "relative rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase ring-2 ring-transparent transition-all",
                sizeClasses[size],
                className
            )}
        >
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            ) : (
                <span>{fallback.slice(0, 2)}</span>
            )}
        </div>
    );
}

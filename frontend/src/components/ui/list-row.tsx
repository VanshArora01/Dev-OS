import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListRowProps {
    title: string;
    subtitle?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    className?: string;
}

export function ListRow({ title, subtitle, leading, trailing, className }: ListRowProps) {
    return (
        <div className={cn("flex items-center gap-3 py-3.5 px-1", className)}>
            {leading}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 truncate">{title}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
            {trailing}
        </div>
    );
}

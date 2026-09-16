import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AvatarClusterProps {
    names?: string[];
    max?: number;
    className?: string;
}

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

const COLORS = [
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-indigo-500",
];

export function AvatarCluster({ names = [], max = 3, className }: AvatarClusterProps) {
    if (!names.length) return null;
    const shown = names.slice(0, max);
    const extra = names.length - shown.length;

    return (
        <div className={cn("flex items-center", className)}>
            {shown.map((name, i) => (
                <Avatar
                    key={`${name}-${i}`}
                    className={cn("h-7 w-7 ring-2 ring-white dark:ring-[#111118] -ml-1.5 first:ml-0", COLORS[i % COLORS.length])}
                >
                    <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                        {initials(name) || "?"}
                    </AvatarFallback>
                </Avatar>
            ))}
            {extra > 0 && (
                <Avatar className="-ml-1.5 h-7 w-7 ring-2 ring-white dark:ring-[#111118]">
                    <AvatarFallback className="bg-slate-200 text-[10px] font-semibold text-slate-600 dark:bg-zinc-700 dark:text-zinc-200">
                        +{extra}
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

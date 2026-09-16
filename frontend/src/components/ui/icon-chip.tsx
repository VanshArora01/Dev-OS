import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentChip, type Accent } from "@/lib/accents";

interface IconChipProps {
    icon: LucideIcon;
    accent?: Accent;
    size?: "sm" | "md";
    className?: string;
}

export function IconChip({ icon: Icon, accent = "violet", size = "md", className }: IconChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center rounded-xl shrink-0",
                size === "sm" ? "h-8 w-8" : "h-10 w-10",
                accentChip[accent],
                className
            )}
        >
            <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} size={size === "sm" ? 14 : 18} />
        </span>
    );
}

import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { Accent } from "@/lib/accents";

interface StatTileProps {
    label: string;
    value: string | number;
    hint?: string;
    urgent?: boolean;
    accent?: Accent;
    icon?: LucideIcon;
    className?: string;
}

export function StatTile({ label, value, hint, urgent, accent, icon, className }: StatTileProps) {
    return (
        <StatCard
            label={label}
            value={value}
            hint={hint}
            accent={accent || (urgent ? "coral" : "violet")}
            icon={icon}
            className={className}
        />
    );
}

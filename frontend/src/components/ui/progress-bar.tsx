import { cn } from "@/lib/utils";
import { accentBar, accentTrack, type Accent } from "@/lib/accents";

interface ProgressBarProps {
    value: number;
    accent?: Accent;
    className?: string;
}

export function ProgressBar({ value, accent = "violet", className }: ProgressBarProps) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className={cn("h-2.5 w-full rounded-full overflow-hidden", accentTrack[accent], className)}>
            <div
                className={cn("h-full rounded-full transition-all duration-500", accentBar[accent])}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

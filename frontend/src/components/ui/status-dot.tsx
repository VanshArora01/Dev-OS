import { cn } from "@/lib/utils";
import { toneDot, type StatusTone } from "@/lib/status";

export function StatusDot({ tone, className = "" }: { tone: StatusTone; className?: string }) {
    return <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", toneDot[tone], className)} />;
}

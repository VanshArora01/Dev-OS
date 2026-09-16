import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/status";
import { toneDot } from "@/lib/status";

interface LogEntryProps {
    timestamp: string;
    meta?: string;
    tone?: StatusTone;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function LogEntry({ timestamp, meta, tone, actions, children, className }: LogEntryProps) {
    return (
        <div className={cn("group relative flex gap-3 py-2.5", className)}>
            <div className="flex flex-col items-center pt-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tone ? toneDot[tone] : "bg-slate-300 dark:bg-zinc-600")} />
                <span className="flex-1 w-px bg-slate-200 dark:bg-zinc-800 mt-1.5" />
            </div>
            <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">{timestamp}</span>
                        {meta && <span className="font-mono text-[10px] text-slate-400 truncate">{meta}</span>}
                    </div>
                    {actions}
                </div>
                <div className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{children}</div>
            </div>
        </div>
    );
}

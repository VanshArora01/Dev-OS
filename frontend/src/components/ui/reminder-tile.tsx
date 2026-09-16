import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { BentoCard } from "@/components/ui/bento-card";
import { StatusPill, type StatusKind } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

const EDGE: Record<StatusKind, string> = {
    pending: "bg-violet-500",
    "in-progress": "bg-amber-500",
    completed: "bg-emerald-500",
    overdue: "bg-rose-500",
    sent: "bg-emerald-500",
    active: "bg-violet-500",
    paused: "bg-amber-500",
    today: "bg-amber-500",
    due: "bg-rose-500",
    personal: "bg-slate-400",
    freelance: "bg-violet-500",
    company: "bg-emerald-500",
    low: "bg-slate-400",
    medium: "bg-sky-500",
    high: "bg-amber-500",
    critical: "bg-rose-500",
};

interface ReminderTileProps {
    date: string | Date;
    title: string;
    meta?: string;
    kind: StatusKind;
    onDelete?: () => void;
}

export function ReminderTile({ date, title, meta, kind, onDelete }: ReminderTileProps) {
    const d = new Date(date);
    return (
        <BentoCard className="relative overflow-hidden min-h-[200px] flex flex-col !p-5">
            <span className={cn("absolute inset-y-0 left-0 w-1.5", EDGE[kind] || EDGE.pending)} />
            <div className="flex items-start justify-between gap-3 pl-2">
                <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.06] px-3 py-2 text-center min-w-[56px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{format(d, "MMM")}</p>
                    <p className="font-heading text-2xl font-bold leading-none mt-0.5">{format(d, "d")}</p>
                </div>
                <StatusPill kind={kind} />
            </div>
            <p className="pl-2 mt-4 text-[15px] font-semibold leading-snug text-slate-900 dark:text-white line-clamp-4 flex-1">
                {title}
            </p>
            <div className="pl-2 mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400 truncate">{meta || format(d, "yyyy")}</p>
                {onDelete && (
                    <button type="button" onClick={onDelete} className="text-slate-300 hover:text-rose-500">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </BentoCard>
    );
}

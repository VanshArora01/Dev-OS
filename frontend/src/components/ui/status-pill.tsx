import { cn } from "@/lib/utils";

export type StatusKind =
    | "pending"
    | "in-progress"
    | "completed"
    | "overdue"
    | "sent"
    | "active"
    | "paused"
    | "today"
    | "due"
    | "personal"
    | "freelance"
    | "company"
    | "low"
    | "medium"
    | "high"
    | "critical";

const PILL: Record<StatusKind, string> = {
    pending: "bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-zinc-300",
    "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    active: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    today: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    due: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    personal: "bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-zinc-300",
    freelance: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    company: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    low: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    high: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const LABELS: Partial<Record<StatusKind, string>> = {
    "in-progress": "In progress",
};

export function statusKindFromValue(value?: string): StatusKind {
    const v = (value || "").toLowerCase();
    if (v === "in-progress" || v === "in progress") return "in-progress";
    if (v in PILL) return v as StatusKind;
    if (v === "done") return "completed";
    if (v === "todo") return "pending";
    return "pending";
}

interface StatusPillProps {
    kind?: StatusKind;
    value?: string;
    className?: string;
}

export function StatusPill({ kind, value, className }: StatusPillProps) {
    const resolved = kind || statusKindFromValue(value);
    const label = value || LABELS[resolved] || resolved.replace("-", " ");
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                PILL[resolved],
                className
            )}
        >
            {label}
        </span>
    );
}

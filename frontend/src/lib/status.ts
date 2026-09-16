export type StatusTone = "healthy" | "attention" | "critical" | "active" | "neutral";

export function projectStatusTone(status?: string): StatusTone {
    if (status === "completed") return "healthy";
    if (status === "active") return "active";
    if (status === "paused") return "attention";
    return "neutral";
}

export function priorityTone(priority?: string): StatusTone {
    if (priority === "critical") return "critical";
    if (priority === "high") return "attention";
    if (priority === "medium") return "attention";
    return "neutral";
}

export function milestoneStatusTone(status?: string): StatusTone {
    if (status === "completed") return "healthy";
    if (status === "in-progress") return "active";
    return "neutral";
}

export function reminderTone(sent?: boolean, isPast?: boolean): StatusTone {
    if (sent) return "healthy";
    if (isPast) return "attention";
    return "neutral";
}

export function healthTone(status?: string): StatusTone {
    if (status === "active") return "healthy";
    if (status === "slipping") return "attention";
    if (status === "inactive") return "neutral";
    return "neutral";
}

export const toneDot: Record<StatusTone, string> = {
    healthy: "bg-emerald-500",
    attention: "bg-amber-500",
    critical: "bg-rose-500",
    active: "bg-indigo-500",
    neutral: "bg-slate-400 dark:bg-zinc-600",
};

export const toneChip: Record<StatusTone, string> = {
    healthy: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    attention: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    critical: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
    active: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
    neutral: "text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800",
};

export const toneText: Record<StatusTone, string> = {
    healthy: "text-emerald-500",
    attention: "text-amber-500",
    critical: "text-rose-500",
    active: "text-indigo-500",
    neutral: "text-slate-400",
};


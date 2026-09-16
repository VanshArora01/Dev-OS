export type Accent = "violet" | "amber" | "emerald" | "coral" | "sky" | "indigo";

export const accentChip: Record<Accent, string> = {
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    coral: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
};

export const accentBar: Record<Accent, string> = {
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    coral: "bg-rose-500",
    sky: "bg-sky-500",
    indigo: "bg-indigo-500",
};

export const accentTrack: Record<Accent, string> = {
    violet: "bg-violet-100 dark:bg-violet-500/15",
    amber: "bg-amber-100 dark:bg-amber-500/15",
    emerald: "bg-emerald-100 dark:bg-emerald-500/15",
    coral: "bg-rose-100 dark:bg-rose-500/15",
    sky: "bg-sky-100 dark:bg-sky-500/15",
    indigo: "bg-indigo-100 dark:bg-indigo-500/15",
};

export const accentBorder: Record<Accent, string> = {
    violet: "border-t-violet-500",
    amber: "border-t-amber-500",
    emerald: "border-t-emerald-500",
    coral: "border-t-rose-500",
    sky: "border-t-sky-500",
    indigo: "border-t-indigo-500",
};

export const accentFill: Record<Accent, string> = {
    violet: "bg-gradient-to-br from-brand via-[#7C6CF6] to-[#5B4BD1]",
    amber: "bg-amber-500",
    emerald: "bg-emerald-600",
    coral: "bg-rose-500",
    sky: "bg-sky-500",
    indigo: "bg-indigo-600",
};

export const accentRing: Record<Accent, string> = {
    violet: "stroke-violet-500",
    amber: "stroke-amber-500",
    emerald: "stroke-emerald-500",
    coral: "stroke-rose-500",
    sky: "stroke-sky-500",
    indigo: "stroke-indigo-500",
};


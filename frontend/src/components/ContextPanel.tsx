import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { getLastSession } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, AlertCircle, CheckCircle2, History } from "lucide-react";

interface ContextPanelProps {
    projectId: string;
}

export const ContextPanel = ({ projectId }: ContextPanelProps) => {
    const { user } = useUser();

    const { data: session, isLoading } = useQuery({
        queryKey: ["lastSession", projectId],
        queryFn: () => getLastSession(projectId, user?.id || ""),
        enabled: !!user?.id && !!projectId,
    });

    if (isLoading) {
        return (
            <div className="w-full p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 shadow-sm space-y-3">
                <Skeleton className="h-3 w-24 bg-slate-50 dark:bg-zinc-900 rounded-lg" />
                <Skeleton className="h-6 w-full bg-slate-50 dark:bg-zinc-900 rounded-lg" />
            </div>
        );
    }

    if (!session) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-4 text-center rounded-xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 shadow-sm"
            >
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                    No active context yet.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-900 shadow-sm space-y-5 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 text-indigo-500 opacity-5 group-hover:opacity-10 transition-opacity">
                <History size={60} />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                        <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-0">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Last Synced</h3>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">
                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
            </div>

            {/* Summary */}
            <div className="relative z-10">
                <p className="text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight italic">
                    "{session.summary}"
                </p>
            </div>

            {/* Problems + Decisions side by side */}
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="flex-1 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                    <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 block">Friction</span>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-400 leading-snug">{session.problems || "None."}</p>
                    </div>
                </div>
                <div className="flex-1 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 block">Decisions</span>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-400 leading-snug">{session.decisions || "None."}</p>
                    </div>
                </div>
            </div>

            {/* Next Step */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-600 dark:bg-indigo-600 text-white relative z-10 shadow-lg shadow-indigo-100 dark:shadow-none">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 shrink-0">Up Next:</span>
                <p className="text-xs font-black text-white leading-none truncate">{session.nextStep}</p>
                <ArrowRight size={14} className="text-white/40 shrink-0 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.div>
    );
};

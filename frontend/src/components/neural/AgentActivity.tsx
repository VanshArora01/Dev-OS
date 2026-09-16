import { CheckCircle2, Loader2 } from 'lucide-react';

interface AgentActivityProps {
    steps: { label: string; success: boolean; status: 'done' | 'active' }[];
    isLoading?: boolean;
}

export function AgentActivity({ steps, isLoading }: AgentActivityProps) {
    if (!isLoading && steps.length === 0) return null;

    return (
        <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Neural AI is working…
            </p>
            <div className="space-y-1.5">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                        {step.status === 'active' ? (
                            <Loader2 size={12} className="animate-spin text-indigo-500 shrink-0" />
                        ) : (
                            <CheckCircle2 size={12} className={`shrink-0 ${step.success ? 'text-emerald-500' : 'text-red-400'}`} />
                        )}
                        <span>{step.label}</span>
                    </div>
                ))}
                {isLoading && steps.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 size={12} className="animate-spin text-indigo-500" />
                        <span>Processing…</span>
                    </div>
                )}
            </div>
        </div>
    );
}

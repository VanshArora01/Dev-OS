import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface PendingAction {
  id: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  description: string;
  requires_approval: boolean;
}

interface AIActionApprovalProps {
  pendingAction: PendingAction;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function AIActionApproval({ pendingAction, onApprove, onReject, isLoading }: AIActionApprovalProps) {
  const isDelete = pendingAction.toolName === 'drive_delete_file';

  return (
    <div className={`mt-3 rounded-xl border p-4 ${
      isDelete
        ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5'
        : 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5'
    }`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isDelete ? 'text-red-500' : 'text-amber-500'}`} />
        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-xs text-slate-500 dark:text-zinc-400">Approval required</p>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{pendingAction.description}</p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AISourceCitationProps {
  sources: { title: string; url?: string; fileId?: string }[];
}

export function AISourceCitation({ sources }: AISourceCitationProps) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          source.url ? (
            <a
              key={`${source.fileId || source.title}-${index}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
            >
              {source.title}
            </a>
          ) : (
            <span
              key={`${source.fileId || source.title}-${index}`}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold"
            >
              {source.title}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

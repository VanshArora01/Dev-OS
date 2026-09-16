import { ExternalLink, FileCode, FolderKanban, Github, X } from 'lucide-react';

interface SourceItem {
    title: string;
    url?: string;
    fileId?: string;
    sourceType?: string;
    path?: string;
    commitSha?: string;
}

interface SourcesPanelProps {
    sources: SourceItem[];
    onClose?: () => void;
    onSelectSource?: (source: SourceItem) => void;
}

function chipClass(sourceType?: string) {
    if (sourceType === 'github') return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200';
    if (sourceType === 'prd') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    if (sourceType === 'drive') return 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200';
    return 'bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-zinc-300';
}

export function SourcesPanel({ sources, onClose, onSelectSource }: SourcesPanelProps) {
    if (!sources.length) return null;

    return (
        <div className="flex flex-col h-full min-h-0 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="h-10 px-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h3 className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Retrieved files
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X size={13} />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sources.map((source, i) => (
                    <div
                        key={`${source.fileId || source.title}-${i}`}
                        className="px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900"
                    >
                        <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-semibold mb-1 ${chipClass(source.sourceType)}`}>
                            {source.sourceType === 'github' ? <Github size={10} /> : source.sourceType === 'prd' ? <FolderKanban size={10} /> : <FileCode size={10} />}
                            {source.sourceType || 'knowledge'}
                        </span>
                        {onSelectSource && source.sourceType === 'github' && source.path ? (
                            <button
                                type="button"
                                onClick={() => onSelectSource(source)}
                                className="block text-left text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-2"
                            >
                                {source.title}
                            </button>
                        ) : source.url ? (
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-1.5 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                <span className="line-clamp-2">{source.title}</span>
                                <ExternalLink size={11} className="shrink-0 mt-0.5" />
                            </a>
                        ) : (
                            <span className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 line-clamp-2">
                                {source.title}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

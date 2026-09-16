import { useEffect, useMemo, useState } from 'react';
import { FileCode, FolderKanban, Github, Sparkles } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { MessageContent } from '@/components/neural/MessageContent';
import { AgentActivity } from '@/components/neural/AgentActivity';
import { useGithubWorkspace } from './GithubSelectionContext';

function sourceTone(sourceType?: string) {
  if (sourceType === 'github') return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200';
  if (sourceType === 'prd') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
  if (sourceType === 'drive') return 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200';
  return 'bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-zinc-300';
}

export function GithubIntelligence({
  forceNeural,
  compact,
  chatOnly,
}: {
  forceNeural?: number;
  compact?: boolean;
  chatOnly?: boolean;
}) {
  const { projectId, repo, selection, branch, setSelection } = useGithubWorkspace();
  const [tab, setTab] = useState<'neural' | 'sources' | 'metadata'>('neural');
  const [input, setInput] = useState('');

  const githubContext = useMemo(() => {
    if (!repo) return undefined;
    return {
      owner: repo.owner,
      repo: repo.name,
      path: selection.path || undefined,
      branch,
      type: selection.kind === 'file' ? 'file' : selection.kind === 'folder' ? 'folder' : 'repo',
    };
  }, [repo, selection, branch]);

  const scopeLabel = selection.kind === 'file' && selection.path
    ? selection.path.split('/').pop()
    : selection.kind === 'folder' && selection.path
      ? selection.path
      : repo?.fullName || 'repository';

  const { messages, sendMessage, isLoading, activitySteps, error } = useAIChat(projectId, {
    persistence: 'ephemeral',
    surface: 'project',
    githubContext,
    sessionKey: `${githubContext?.owner || ''}/${githubContext?.repo || ''}:${githubContext?.path || ''}:${githubContext?.type || 'repo'}`,
  });
  const sources = messages.flatMap((m) => m.sources || []);

  useEffect(() => {
    if (forceNeural) setTab('neural');
  }, [forceNeural]);

  const openSource = (s: { sourceType?: string; path?: string; title: string; commitSha?: string }) => {
    if (s.sourceType === 'github' && s.path) {
      setSelection({ path: s.path, kind: 'file', sha: s.commitSha });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {!chatOnly && (
        <div className="h-10 px-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
          {(['neural', 'sources', 'metadata'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`text-[11px] font-semibold capitalize ${tab === id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
            >
              {id}
            </button>
          ))}
        </div>
      )}
      {(chatOnly || tab === 'neural') && (
        <>
          <div className="px-3 py-2">
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-violet-50 dark:bg-violet-500/15 text-[10px] font-semibold text-violet-700 dark:text-violet-200">
              <Sparkles size={10} /> Asking about: {scopeLabel}
            </span>
          </div>
          <div className="flex-1 overflow-auto px-3 space-y-3">
            {messages.length === 0 && !isLoading && (
              <p className="text-xs text-slate-400">Temporary chat for this selection — history is not shared with Neural AI.</p>
            )}
            {activitySteps.length > 0 && <AgentActivity steps={activitySteps} />}
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{msg.role}</p>
                <MessageContent content={msg.content} />
              </div>
            ))}
          </div>
            {error && <p className="text-xs text-rose-500 px-3">{error}</p>}
            <form
            className="p-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || isLoading) return;
              sendMessage(input);
              setInput('');
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={compact ? 'Ask about this file' : 'Ask about this selection'}
              disabled={isLoading}
              className="flex-1 h-9 px-3 rounded-full border border-slate-200 dark:border-white/[0.08] bg-transparent text-xs"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="h-9 px-3 rounded-full bg-brand text-white text-xs font-semibold disabled:opacity-40">
              {isLoading ? '…' : 'Send'}
            </button>
          </form>
        </>
      )}
      {!chatOnly && tab === 'sources' && (
        <div className="p-3 space-y-2 overflow-auto">
          {sources.length === 0 && (
            <p className="text-xs text-slate-500">Sources appear when Neural retrieves GitHub, PRD, or Drive context.</p>
          )}
          {sources.map((s, i) => (
            <button
              key={`${s.title}-${i}`}
              type="button"
              onClick={() => openSource(s)}
              className="w-full text-left px-3 py-2 rounded-xl border border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-semibold ${sourceTone(s.sourceType)}`}>
                {s.sourceType === 'github' ? <Github size={10} /> : s.sourceType === 'prd' ? <FolderKanban size={10} /> : <FileCode size={10} />}
                {s.sourceType || 'knowledge'}
              </span>
              <p className="text-xs mt-1 font-medium line-clamp-2">{s.title}</p>
            </button>
          ))}
        </div>
      )}
      {!chatOnly && tab === 'metadata' && (
        <div className="p-3 text-xs space-y-1 text-slate-500">
          <p>Repository: {repo?.fullName}</p>
          <p>Branch: {branch}</p>
          <p>Selection: {selection.path || 'repository root'}</p>
          <p>Kind: {selection.kind}</p>
        </div>
      )}
    </div>
  );
}

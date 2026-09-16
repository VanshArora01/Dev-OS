import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  connectProjectGithubRepository,
  getGithubConnectUrl,
  getGithubStatus,
  listGithubRepositories,
  listProjectGithubRepositories,
  refreshGithubRepository,
} from '@/lib/api';
import type { GithubLinkedRepository } from '@/lib/types';
import { isElectronApp } from '@/lib/electronAuth';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  GithubWorkspaceContext,
  type GithubCanvasMode,
  type GithubKind,
  type GithubSelection,
} from './GithubSelectionContext';
import { GithubModeSwitcher } from './GithubModeSwitcher';
import { GithubFileTree } from './GithubFileTree';
import { GithubCodePane } from './GithubCodePane';
import { GithubOverview } from './GithubOverview';
import { GithubActivity } from './GithubActivity';
import { GithubIntelligence } from './GithubIntelligence';
import { GithubIndexStatus } from './GithubIndexStatus';
import { GithubGraph } from './GithubGraph';

const ACTIVE_REPO_KEY = (projectId: string) => `devos:gh-active:${projectId}`;
const MODE_FADE = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

function parseMode(value: string | null): GithubCanvasMode {
  if (value === 'graph' || value === 'code' || value === 'activity' || value === 'overview') return value;
  return 'overview';
}

function loadStoredSelection(projectId: string): GithubSelection {
  try {
    const raw = sessionStorage.getItem(`devos:gh-sel:${projectId}`);
    if (raw) return JSON.parse(raw) as GithubSelection;
  } catch {
    /* ignore */
  }
  return { path: '', kind: 'repo' };
}

export function GithubWorkspace({ projectId }: { projectId: string }) {
  const { user } = useUser();
  const clerkId = user?.id || '';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectOpen, setConnectOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [codeChatOpen, setCodeChatOpen] = useState(false);

  const statusQ = useQuery({
    queryKey: ['gh-status', clerkId],
    queryFn: () => getGithubStatus(clerkId),
    enabled: !!clerkId,
  });
  const linkedQ = useQuery({
    queryKey: ['gh-linked', projectId, clerkId],
    queryFn: () => listProjectGithubRepositories(projectId, clerkId),
    enabled: !!clerkId,
  });
  const accessibleQ = useQuery({
    queryKey: ['gh-accessible', clerkId, repoSearch],
    queryFn: () => listGithubRepositories(clerkId, repoSearch),
    enabled: !!clerkId && connectOpen,
  });

  const linked: GithubLinkedRepository[] = linkedQ.data?.repositories || [];
  const stored = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_REPO_KEY(projectId)) : null;
  const paramRepo = searchParams.get('ghRepo');
  const repo =
    linked.find((r) => r.fullName === paramRepo) ||
    linked.find((r) => r.fullName === stored) ||
    linked[0] ||
    null;

  const [branch, setBranchState] = useState(searchParams.get('ghBranch') || repo?.defaultBranch || '');
  const [canvasMode, setCanvasModeState] = useState<GithubCanvasMode>(parseMode(searchParams.get('ghMode')));
  const [selection, setSelectionState] = useState<GithubSelection>(() => loadStoredSelection(projectId));

  useEffect(() => {
    if (repo?.defaultBranch && !branch) setBranchState(repo.defaultBranch);
  }, [repo?.defaultBranch, branch]);

  useEffect(() => {
    if (repo?.fullName) localStorage.setItem(ACTIVE_REPO_KEY(projectId), repo.fullName);
  }, [repo?.fullName, projectId]);

  const syncUrl = useCallback(
    (patch: {
      mode?: GithubCanvasMode;
      branch?: string;
      repoName?: string;
    }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'github');
        const mode = patch.mode ?? canvasMode;
        const nextBranch = patch.branch ?? branch;
        const nextRepo = patch.repoName ?? repo?.fullName;
        next.set('ghMode', mode);
        if (nextBranch) next.set('ghBranch', nextBranch);
        else next.delete('ghBranch');
        if (nextRepo) next.set('ghRepo', nextRepo);
        next.delete('ghPath');
        next.delete('ghKind');
        next.delete('ghSha');
        next.delete('ghPr');
        const same =
          next.get('tab') === prev.get('tab') &&
          next.get('ghMode') === prev.get('ghMode') &&
          next.get('ghBranch') === prev.get('ghBranch') &&
          next.get('ghRepo') === prev.get('ghRepo') &&
          !prev.get('ghPath');
        if (same) return prev;
        return next;
      }, { replace: true });
    },
    [branch, canvasMode, repo?.fullName, setSearchParams]
  );

  const setCanvasMode = useCallback(
    (mode: GithubCanvasMode) => {
      setCanvasModeState(mode);
      syncUrl({ mode });
    },
    [syncUrl]
  );

  const setBranch = useCallback(
    (next: string) => {
      setBranchState(next);
      syncUrl({ branch: next });
    },
    [syncUrl]
  );

  const setSelection = useCallback(
    (next: Partial<GithubSelection> & { path?: string; kind?: GithubKind }) => {
      setSelectionState((prev) => {
        const merged: GithubSelection = {
          path: next.path ?? prev.path,
          kind: next.kind ?? prev.kind,
          sha: next.sha,
          pr: next.pr,
          line: next.line,
        };
        try {
          sessionStorage.setItem(`devos:gh-sel:${projectId}`, JSON.stringify(merged));
        } catch {
          /* ignore quota */
        }
        return merged;
      });
    },
    [projectId]
  );

  const ctx = useMemo(
    () => ({
      projectId,
      clerkId,
      repo,
      branch: branch || repo?.defaultBranch || '',
      setBranch,
      selection,
      setSelection,
      canvasMode,
      setCanvasMode,
      focusMode: 'default' as const,
      setFocusMode: () => undefined,
      neuralScope: selection.kind,
    }),
    [projectId, clerkId, repo, branch, setBranch, selection, setSelection, canvasMode, setCanvasMode]
  );

  const connectAccount = async () => {
    const { connectUrl } = await getGithubConnectUrl(clerkId);
    if (isElectronApp() && window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(connectUrl);
    } else {
      window.location.href = connectUrl;
    }
  };

  if (statusQ.isLoading || linkedQ.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" size={16} /> Loading GitHub workspace
      </div>
    );
  }

  if (!statusQ.data?.connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-slate-500 max-w-md">
          Connect GitHub in Settings to explore this project’s codebase, commits, and pull requests. Tokens stay on the server.
        </p>
        <button type="button" onClick={connectAccount} className="btn-primary h-9">
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <GithubWorkspaceContext.Provider value={ctx}>
      <div className="flex flex-col h-[calc(100vh-92px)] min-h-[560px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#12121a]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <select
            aria-label="Linked repository"
            value={repo?.fullName || ''}
            onChange={(e) => syncUrl({ repoName: e.target.value })}
            className="h-9 px-3 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm"
          >
            {linked.length === 0 && <option value="">No repository linked</option>}
            {linked.map((item) => (
              <option key={item.fullName} value={item.fullName}>{item.fullName}</option>
            ))}
          </select>
          <button type="button" onClick={() => setConnectOpen((v) => !v)} className="h-9 px-3 rounded-full text-sm font-semibold bg-slate-100 dark:bg-white/[0.06]">
            <Link2 size={14} className="inline mr-1" /> Link repo
          </button>
          {repo && (
            <>
              <button
                type="button"
                aria-label="Refresh repository"
                onClick={async () => {
                  await refreshGithubRepository(clerkId, repo.owner, repo.name);
                  queryClient.invalidateQueries({ queryKey: ['gh-tree'] });
                  queryClient.invalidateQueries({ queryKey: ['gh-file'] });
                }}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full"
              >
                <RefreshCw size={14} />
              </button>
              <GithubIndexStatus />
            </>
          )}
          <div className="ml-auto">
            <GithubModeSwitcher value={canvasMode} onChange={setCanvasMode} />
          </div>
        </div>

        {connectOpen && (
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] space-y-2 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search accessible repositories"
                  className="w-full h-9 pl-8 rounded-full border border-slate-200 dark:border-white/[0.08] bg-transparent text-sm"
                />
              </div>
              <button type="button" onClick={() => setConnectOpen(false)} className="h-9 px-3 text-sm">Close</button>
            </div>
            <div className="max-h-48 overflow-auto space-y-1">
              {(accessibleQ.data?.repositories || []).map((item: GithubLinkedRepository) => (
                <button
                  key={item.fullName}
                  type="button"
                  onClick={async () => {
                    await connectProjectGithubRepository(projectId, clerkId, item.owner, item.name);
                    setConnectOpen(false);
                    await queryClient.invalidateQueries({ queryKey: ['gh-linked', projectId] });
                    syncUrl({ repoName: item.fullName });
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] text-sm"
                >
                  <span className="font-semibold">{item.fullName}</span>
                  <span className="text-slate-400 ml-2">{item.private ? 'private' : 'public'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!repo ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-500">
            Link a repository to this project to open the GitHub workspace.
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={canvasMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MODE_FADE}
                className="absolute inset-0"
              >
                {canvasMode === 'overview' && <GithubOverview />}
                {canvasMode === 'graph' && <GithubGraph />}
                {canvasMode === 'activity' && <GithubActivity />}
                {canvasMode === 'code' && (
                  <ResizablePanelGroup direction="horizontal" autoSaveId={`devos-gh-code-${projectId}`} className="h-full">
                    <ResizablePanel defaultSize={22} minSize={14} className="min-w-[180px] border-r border-slate-100 dark:border-white/[0.06]">
                      <GithubFileTree />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={codeChatOpen ? 53 : 78} minSize={30}>
                      <GithubCodePane onAskNeural={() => setCodeChatOpen(true)} />
                    </ResizablePanel>
                    {codeChatOpen && (
                      <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={25} minSize={18}>
                          <div className="h-full min-h-0 flex flex-col">
                            <div className="h-10 px-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                              <span className="text-[11px] font-semibold inline-flex items-center gap-1">
                                <Sparkles size={12} /> Neural
                              </span>
                              <button type="button" aria-label="Close chat" onClick={() => setCodeChatOpen(false)} className="h-7 w-7 inline-flex items-center justify-center rounded-full">
                                <X size={14} />
                              </button>
                            </div>
                            <div className="flex-1 min-h-0">
                              <GithubIntelligence compact chatOnly />
                            </div>
                          </div>
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </GithubWorkspaceContext.Provider>
  );
}

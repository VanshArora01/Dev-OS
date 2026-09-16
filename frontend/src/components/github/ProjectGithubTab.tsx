import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Folder,
  FileCode,
  Loader2,
  RefreshCw,
  Link2,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  connectProjectGithubRepository,
  getGithubBranches,
  getGithubCommit,
  getGithubCommits,
  getGithubFile,
  getGithubIssues,
  getGithubPull,
  getGithubPulls,
  getGithubStatus,
  getGithubTree,
  indexGithubRepository,
  listGithubRepositories,
  listProjectGithubRepositories,
  refreshGithubRepository,
} from '@/lib/api';
import type { GithubContextScope, GithubLinkedRepository } from '@/lib/types';
import { CodeViewer } from './CodeViewer';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

type ExplorerTab = 'code' | 'commits' | 'pulls' | 'branches';

interface TreeEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | string;
  size?: number;
}

export function ProjectGithubTab({ projectId }: { projectId: string }) {
  const { user } = useUser();
  const clerkId = user?.id || '';
  const [status, setStatus] = useState<any>(null);
  const [linked, setLinked] = useState<GithubLinkedRepository[]>([]);
  const [accessible, setAccessible] = useState<any[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [activeRepo, setActiveRepo] = useState<GithubLinkedRepository | null>(null);
  const [tab, setTab] = useState<ExplorerTab>('code');
  const [path, setPath] = useState('');
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [file, setFile] = useState<any>(null);
  const [relationships, setRelationships] = useState<any>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [commit, setCommit] = useState<any>(null);
  const [pulls, setPulls] = useState<any[]>([]);
  const [pull, setPull] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [defaultBranch, setDefaultBranch] = useState('');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  const githubContext: GithubContextScope | undefined = activeRepo
    ? {
        owner: activeRepo.owner,
        repo: activeRepo.name,
        path: file?.path || path || undefined,
        branch: defaultBranch || activeRepo.defaultBranch,
        type: file?.path ? 'file' : path ? 'folder' : 'repo',
      }
    : undefined;

  const { messages, sendMessage, isLoading, error } = useAIChat(projectId, {
    persistence: 'ephemeral',
    surface: 'project',
    githubContext,
    sessionKey: `${githubContext?.path || ''}:${githubContext?.type || 'repo'}`,
  });
  const [prompt, setPrompt] = useState('');

  const crumbs = useMemo(() => {
    const parts = (file?.path || path || '').split('/').filter(Boolean);
    const items = [{ label: activeRepo?.name || 'repository', value: '' }];
    let acc = '';
    parts.forEach((part: string) => {
      acc = acc ? `${acc}/${part}` : part;
      items.push({ label: part, value: acc });
    });
    return items;
  }, [activeRepo, file, path]);

  const loadLinked = async () => {
    if (!clerkId) return;
    const [githubStatus, projectRepos] = await Promise.all([
      getGithubStatus(clerkId),
      listProjectGithubRepositories(projectId, clerkId),
    ]);
    setStatus(githubStatus);
    setLinked(projectRepos.repositories || []);
    if (!activeRepo && projectRepos.repositories?.[0]) {
      setActiveRepo(projectRepos.repositories[0]);
    }
  };

  useEffect(() => {
    loadLinked().catch((err) => setMessage(err.message));
  }, [clerkId, projectId]);

  const loadTree = async (dir = '') => {
    if (!clerkId || !activeRepo) return;
    setLoading(true);
    try {
      const tree = await getGithubTree(clerkId, projectId, activeRepo.owner, activeRepo.name, dir);
      setPath(dir);
      setFile(null);
      setRelationships(null);
      setEntries(tree.entries || []);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (filePath: string) => {
    if (!clerkId || !activeRepo) return;
    setLoading(true);
    try {
      const result = await getGithubFile(clerkId, projectId, activeRepo.owner, activeRepo.name, filePath);
      setFile(result.file);
      setRelationships(result.relationships);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    if (!clerkId || !activeRepo) return;
    setLoading(true);
    try {
      const [commitRes, pullRes, branchRes, issueRes] = await Promise.all([
        getGithubCommits(clerkId, projectId, activeRepo.owner, activeRepo.name),
        getGithubPulls(clerkId, projectId, activeRepo.owner, activeRepo.name),
        getGithubBranches(clerkId, projectId, activeRepo.owner, activeRepo.name),
        getGithubIssues(clerkId, projectId, activeRepo.owner, activeRepo.name).catch(() => ({ issues: [] })),
      ]);
      setCommits(commitRes.commits || []);
      setPulls(pullRes.pullRequests || []);
      setBranches(branchRes.branches || []);
      setDefaultBranch(branchRes.defaultBranch || activeRepo.defaultBranch || '');
      setIssues(issueRes.issues || []);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeRepo) return;
    if (tab === 'code') loadTree('');
    else loadActivity();
  }, [activeRepo?.fullName, tab]);

  const searchRepos = async () => {
    if (!clerkId) return;
    const result = await listGithubRepositories(clerkId, repoSearch);
    setAccessible(result.repositories || []);
  };

  const connectRepo = async (owner: string, name: string) => {
    if (!clerkId) return;
    await connectProjectGithubRepository(projectId, clerkId, owner, name);
    setConnectOpen(false);
    await loadLinked();
  };

  if (!status?.connected) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Connect GitHub in Settings to explore this project's codebase.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-92px)] min-h-[560px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#12121a]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
        <select
          value={activeRepo?.fullName || ''}
          onChange={(e) => setActiveRepo(linked.find((r) => r.fullName === e.target.value) || null)}
          className="h-9 px-3 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm"
        >
          {linked.length === 0 && <option value="">No repository linked</option>}
          {linked.map((repo) => (
            <option key={repo.fullName} value={repo.fullName}>{repo.fullName}</option>
          ))}
        </select>
        <button onClick={() => { setConnectOpen(true); searchRepos(); }} className="h-9 px-3 rounded-full text-sm font-semibold bg-slate-100 dark:bg-white/[0.06]">
          <Link2 size={14} className="inline mr-1" /> Link repo
        </button>
        {activeRepo && (
          <>
            <button
              onClick={async () => {
                await refreshGithubRepository(clerkId, activeRepo.owner, activeRepo.name);
                if (tab === 'code') loadTree(path);
                else loadActivity();
              }}
              className="h-9 px-3 rounded-full text-sm"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={async () => {
                setIndexStatus('Indexing…');
                try {
                  const result = await indexGithubRepository(clerkId, projectId, activeRepo.owner, activeRepo.name);
                  setIndexStatus(`Indexed ${result.indexedCount || 0} files`);
                } catch (err: any) {
                  setIndexStatus(err.message);
                }
              }}
              className="h-9 px-3 rounded-full text-sm font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              Index for Neural
            </button>
          </>
        )}
        {indexStatus && <span className="text-xs text-slate-400">{indexStatus}</span>}
        <div className="ml-auto flex gap-1 rounded-full bg-slate-100 dark:bg-white/[0.04] p-1">
          {([
            ['code', FileCode],
            ['commits', GitCommitHorizontal],
            ['pulls', GitPullRequest],
            ['branches', GitBranch],
          ] as const).map(([id, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('h-8 px-3 rounded-full text-xs font-semibold capitalize', tab === id && 'bg-brand text-white')}
            >
              <Icon size={13} className="inline mr-1" /> {id}
            </button>
          ))}
        </div>
      </div>

      {message && <div className="px-4 py-2 text-xs text-rose-500 border-b border-rose-100">{message}</div>}

      {connectOpen && (
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] space-y-2">
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
            <button onClick={searchRepos} className="btn-primary h-9">Search</button>
            <button onClick={() => setConnectOpen(false)} className="h-9 px-3 text-sm">Close</button>
          </div>
          <div className="max-h-48 overflow-auto space-y-1">
            {accessible.map((repo) => (
              <button
                key={repo.fullName}
                onClick={() => connectRepo(repo.owner, repo.name)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] text-sm"
              >
                <span className="font-semibold">{repo.fullName}</span>
                <span className="text-slate-400 ml-2">{repo.private ? 'private' : 'public'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!activeRepo ? (
        <div className="p-8 text-sm text-slate-500">Link a GitHub repository to this project to explore the codebase.</div>
      ) : tab === 'code' ? (
        <div className="flex-1 min-h-0 grid grid-cols-12">
          <div className="col-span-3 border-r border-slate-100 dark:border-white/[0.06] overflow-auto p-2">
            <div className="flex flex-wrap gap-1 px-1 pb-2 text-[11px] text-slate-400">
              {crumbs.map((crumb) => (
                <button key={crumb.value || 'root'} onClick={() => loadTree(crumb.value)} className="hover:text-indigo-500">
                  {crumb.label}/
                </button>
              ))}
            </div>
            {loading && <Loader2 className="w-4 h-4 animate-spin m-3" />}
            {entries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => (entry.type === 'dir' ? loadTree(entry.path) : openFile(entry.path))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                {entry.type === 'dir' ? <Folder size={14} /> : <FileCode size={14} />}
                <span className="truncate">{entry.name}</span>
              </button>
            ))}
          </div>
          <div className="col-span-6 min-h-0 flex flex-col">
            {file ? (
              <CodeViewer
                path={file.path}
                language={file.language}
                content={file.content || ''}
                binary={file.binary}
                tooLarge={file.tooLarge}
                className="flex-1"
              />
            ) : (
              <div className="p-8 text-sm text-slate-400">Select a file to read source code.</div>
            )}
          </div>
          <div className="col-span-3 border-l border-slate-100 dark:border-white/[0.06] overflow-auto p-3 space-y-3 text-sm">
            {file && (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">File</p>
                  <p className="font-semibold">{file.path}</p>
                  <p className="text-xs text-slate-400">{file.language} · {defaultBranch || activeRepo.defaultBranch}</p>
                  {file.commit && <p className="text-xs mt-1">{file.commit.message}</p>}
                </div>
                {relationships?.imports?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Imports</p>
                    {relationships.imports.slice(0, 12).map((item: string) => <p key={item} className="truncate">{item}</p>)}
                  </div>
                )}
                {relationships?.usedBy?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Used by</p>
                    {relationships.usedBy.map((item: string) => <p key={item}>{item}</p>)}
                  </div>
                )}
                {relationships?.exports?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Exports</p>
                    {relationships.exports.slice(0, 12).map((item: string) => <p key={item}>{item}</p>)}
                  </div>
                )}
              </>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <Sparkles size={12} /> Neural (scoped)
              </p>
              <div className="space-y-2 max-h-40 overflow-auto">
                {messages.slice(-4).map((msg, i) => (
                  <p key={i} className="text-xs text-slate-600 dark:text-zinc-300">{msg.role}: {msg.content.slice(0, 180)}</p>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={file ? 'Ask about this file' : path ? 'Ask about this folder' : 'Ask about this repository'}
                  className="flex-1 h-8 px-3 rounded-full border text-xs"
                />
                <button
                  disabled={isLoading || !prompt.trim()}
                  onClick={() => { sendMessage(prompt); setPrompt(''); }}
                  className="h-8 px-3 rounded-full bg-brand text-white text-xs disabled:opacity-40"
                >
                  {isLoading ? '…' : 'Ask'}
                </button>
              </div>
              {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
            </div>
          </div>
        </div>
      ) : tab === 'commits' ? (
        <div className="flex-1 min-h-0 grid grid-cols-12">
          <div className="col-span-5 overflow-auto border-r border-slate-100 dark:border-white/[0.06]">
            {commits.map((item) => (
              <button key={item.sha} onClick={async () => {
                const result = await getGithubCommit(clerkId, projectId, activeRepo.owner, activeRepo.name, item.sha);
                setCommit(result);
              }} className="w-full text-left px-4 py-3 border-b border-slate-50 dark:border-white/[0.04]">
                <p className="text-sm font-medium line-clamp-2">{item.message}</p>
                <p className="text-xs text-slate-400">{item.author} · {item.shortSha} · {item.date ? new Date(item.date).toLocaleString() : ''}</p>
              </button>
            ))}
          </div>
          <div className="col-span-7 overflow-auto p-4 text-sm space-y-3">
            {commit?.commit ? (
              <>
                <h3 className="font-semibold">{commit.commit.message}</h3>
                <p className="text-slate-500">{commit.commit.author} · {commit.commit.sha}</p>
                <p>{commit.commit.stats?.additions || 0} additions / {commit.commit.stats?.deletions || 0} deletions</p>
                {commit.traceability?.matches?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Related project context</p>
                    {commit.traceability.matches.map((m: any, i: number) => (
                      <p key={i} className="text-xs">{m.kind}: {m.title} ({m.confidence})</p>
                    ))}
                  </div>
                )}
                {commit.commit.files?.map((f: any) => (
                  <div key={f.filename} className="rounded-xl border border-slate-100 dark:border-white/[0.06] p-3">
                    <p className="font-medium">{f.filename} · {f.status}</p>
                    {f.patch && <pre className="mt-2 text-[11px] overflow-auto whitespace-pre-wrap">{f.patch}</pre>}
                  </div>
                ))}
              </>
            ) : <p className="text-slate-400">Select a commit.</p>}
          </div>
        </div>
      ) : tab === 'pulls' ? (
        <div className="flex-1 min-h-0 grid grid-cols-12">
          <div className="col-span-5 overflow-auto border-r border-slate-100 dark:border-white/[0.06]">
            {pulls.map((item) => (
              <button key={item.number} onClick={async () => {
                const result = await getGithubPull(clerkId, projectId, activeRepo.owner, activeRepo.name, item.number);
                setPull(result);
              }} className="w-full text-left px-4 py-3 border-b border-slate-50 dark:border-white/[0.04]">
                <p className="text-sm font-medium">#{item.number} {item.title}</p>
                <p className="text-xs text-slate-400">{item.state} · {item.author}</p>
              </button>
            ))}
          </div>
          <div className="col-span-7 overflow-auto p-4 text-sm space-y-3">
            {pull?.pullRequest ? (
              <>
                <h3 className="font-semibold">#{pull.pullRequest.number} {pull.pullRequest.title}</h3>
                <p className="text-slate-500">{pull.pullRequest.state} · {pull.pullRequest.author}</p>
                <p className="whitespace-pre-wrap">{pull.pullRequest.body}</p>
                {pull.traceability?.matches?.length > 0 && (
                  <div>
                    {pull.traceability.matches.map((m: any, i: number) => (
                      <p key={i} className="text-xs">{m.kind}: {m.title} ({m.confidence})</p>
                    ))}
                  </div>
                )}
                <p className="text-xs">Files: {(pull.pullRequest.files || []).map((f: any) => f.filename).join(', ')}</p>
              </>
            ) : <p className="text-slate-400">Select a pull request.</p>}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <p className="text-sm">Default branch: <span className="font-semibold">{defaultBranch}</span></p>
          {branches.map((branch) => (
            <div key={branch.name} className="px-3 py-2 rounded-xl border border-slate-100 dark:border-white/[0.06] text-sm">
              {branch.name} {branch.isDefault ? '(default)' : ''} · {String(branch.sha || '').slice(0, 7)}
            </div>
          ))}
          {issues.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Issues</p>
              {issues.map((issue) => (
                <p key={issue.number} className="text-sm">#{issue.number} {issue.title} ({issue.state})</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

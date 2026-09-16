import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusPill } from '@/components/ui/status-pill';
import { getGithubBranches, getGithubCommit, getGithubCommits, getGithubPull, getGithubPulls } from '@/lib/api';
import { useGithubWorkspace } from './GithubSelectionContext';

export function GithubActivity() {
  const { clerkId, projectId, repo, setSelection, setCanvasMode, branch, setBranch } = useGithubWorkspace();
  const [commitSha, setCommitSha] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<number | null>(null);

  const commitsQ = useQuery({
    queryKey: ['gh-commits', repo?.fullName, branch],
    queryFn: () => getGithubCommits(clerkId, projectId, repo!.owner, repo!.name, { sha: branch }),
    enabled: !!repo,
  });
  const pullsQ = useQuery({
    queryKey: ['gh-pulls', repo?.fullName],
    queryFn: () => getGithubPulls(clerkId, projectId, repo!.owner, repo!.name, 'all'),
    enabled: !!repo,
  });
  const branchesQ = useQuery({
    queryKey: ['gh-branches', repo?.fullName],
    queryFn: () => getGithubBranches(clerkId, projectId, repo!.owner, repo!.name),
    enabled: !!repo,
  });
  const commitQ = useQuery({
    queryKey: ['gh-commit', repo?.fullName, commitSha],
    queryFn: () => getGithubCommit(clerkId, projectId, repo!.owner, repo!.name, commitSha!),
    enabled: !!repo && !!commitSha,
  });
  const pullQ = useQuery({
    queryKey: ['gh-pull', repo?.fullName, prNumber],
    queryFn: () => getGithubPull(clerkId, projectId, repo!.owner, repo!.name, prNumber!),
    enabled: !!repo && !!prNumber,
  });

  if (!repo) return null;

  return (
    <div className="h-full overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Commits</h3>
        {(commitsQ.data?.commits || []).map((c: any) => (
          <button key={c.sha} type="button" onClick={() => setCommitSha(c.sha)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] mb-1">
            <p className="text-sm font-medium line-clamp-2">{c.message}</p>
            <p className="text-[11px] text-slate-400">{c.author} · {c.shortSha}</p>
          </button>
        ))}
      </section>
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Pull requests</h3>
        {(pullsQ.data?.pullRequests || []).length === 0 && <p className="text-sm text-slate-500">No open pull requests.</p>}
        {(pullsQ.data?.pullRequests || []).map((p: any) => (
          <button key={p.number} type="button" onClick={() => setPrNumber(p.number)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">#{p.number} {p.title}</span>
              <StatusPill kind={p.state === 'merged' ? 'completed' : p.state === 'open' ? 'active' : 'pending'} value={p.state} />
            </div>
          </button>
        ))}
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 mt-6 mb-2">Branches</h3>
        {(branchesQ.data?.branches || []).map((b: any) => (
          <button key={b.name} type="button" onClick={() => setBranch(b.name)} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] mb-1 text-sm">
            {b.name} {b.isDefault || b.name === branch ? '(current)' : ''} · {String(b.sha || '').slice(0, 7)}
          </button>
        ))}
      </section>

      <Dialog open={!!commitSha} onOpenChange={(o) => !o && setCommitSha(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{commitQ.data?.commit?.message || 'Commit'}</DialogTitle></DialogHeader>
          {commitQ.data?.commit && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-500">{commitQ.data.commit.author} · {commitQ.data.commit.sha}</p>
              <p>{commitQ.data.commit.stats?.additions || 0} additions / {commitQ.data.commit.stats?.deletions || 0} deletions</p>
              {(commitQ.data.traceability?.matches || []).map((m: any, i: number) => (
                <p key={i} className="text-xs">{m.kind}: {m.title} ({m.confidence})</p>
              ))}
              {(commitQ.data.commit.files || []).map((f: any) => (
                <button key={f.filename} type="button" className="block w-full text-left rounded-xl border p-3" onClick={() => {
                  setSelection({ path: f.filename, kind: 'file', sha: commitSha || undefined });
                  setCanvasMode('code');
                  setCommitSha(null);
                }}>
                  {f.filename} · {f.status}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!prNumber} onOpenChange={(o) => !o && setPrNumber(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>#{pullQ.data?.pullRequest?.number} {pullQ.data?.pullRequest?.title}</DialogTitle></DialogHeader>
          {pullQ.data?.pullRequest && (
            <div className="space-y-3 text-sm whitespace-pre-wrap">
              <p className="text-slate-500">{pullQ.data.pullRequest.state} · {pullQ.data.pullRequest.author}</p>
              <p>{pullQ.data.pullRequest.body}</p>
              {(pullQ.data.pullRequest.files || []).map((f: any) => (
                <button key={f.filename} type="button" className="block w-full text-left rounded-xl border p-2" onClick={() => {
                  setSelection({ path: f.filename, kind: 'file' });
                  setCanvasMode('code');
                  setPrNumber(null);
                }}>{f.filename}</button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

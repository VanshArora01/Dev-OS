import { useQuery } from '@tanstack/react-query';
import { BentoCard } from '@/components/ui/bento-card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill } from '@/components/ui/status-pill';
import { getGithubBranches, getGithubCommits, getGithubPulls, getGithubRepository } from '@/lib/api';
import { useGithubWorkspace } from './GithubSelectionContext';

export function GithubOverview() {
  const { clerkId, projectId, repo, branch } = useGithubWorkspace();
  const repoQ = useQuery({
    queryKey: ['gh-repo', repo?.fullName],
    queryFn: () => getGithubRepository(clerkId, repo!.owner, repo!.name),
    enabled: !!repo,
  });
  const commitsQ = useQuery({
    queryKey: ['gh-commits', repo?.fullName, branch],
    queryFn: () => getGithubCommits(clerkId, projectId, repo!.owner, repo!.name, { sha: branch }),
    enabled: !!repo,
  });
  const pullsQ = useQuery({
    queryKey: ['gh-pulls', repo?.fullName],
    queryFn: () => getGithubPulls(clerkId, projectId, repo!.owner, repo!.name, 'open'),
    enabled: !!repo,
  });
  const branchesQ = useQuery({
    queryKey: ['gh-branches', repo?.fullName],
    queryFn: () => getGithubBranches(clerkId, projectId, repo!.owner, repo!.name),
    enabled: !!repo,
  });

  const meta = repoQ.data?.repository || repo;
  const latest = commitsQ.data?.commits?.[0];

  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <BentoCard variant="filled" accent="indigo">
        <p className="text-[11px] uppercase tracking-widest text-white/70">Repository</p>
        <h2 className="text-xl font-heading font-bold text-white mt-1">{meta?.fullName || repo?.fullName}</h2>
        <p className="text-sm text-white/80 mt-2">{meta?.description || 'Linked GitHub repository for this DevOS project.'}</p>
        <div className="flex gap-2 mt-3">
          <StatusPill kind={meta?.private ? 'paused' : 'completed'} value={meta?.private ? 'Private' : 'Public'} className="bg-white/20 text-white" />
          <StatusPill kind="active" value={branch || meta?.defaultBranch} className="bg-white/20 text-white" />
          {meta?.language && <StatusPill kind="personal" value={meta.language} className="bg-white/20 text-white" />}
        </div>
      </BentoCard>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard span="" label="Recent commits" value={(commitsQ.data?.commits || []).length} />
        <StatCard span="" label="Open PRs" value={(pullsQ.data?.pullRequests || []).length} />
        <StatCard span="" label="Branches" value={(branchesQ.data?.branches || []).length} />
        <StatCard span="" label="Default branch" value={meta?.defaultBranch || branch || '—'} />
      </div>
      {latest && (
        <BentoCard>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Latest activity</p>
          <p className="text-sm font-medium mt-1">{latest.message}</p>
          <p className="text-xs text-slate-500 mt-1">{latest.author} · {latest.shortSha}</p>
        </BentoCard>
      )}
    </div>
  );
}

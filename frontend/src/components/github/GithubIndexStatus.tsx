import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGithubIndexStatus, indexGithubRepository } from '@/lib/api';
import { ProgressRing } from '@/components/ui/progress-ring';
import { useGithubWorkspace } from './GithubSelectionContext';

export function GithubIndexStatus() {
  const { clerkId, projectId, repo } = useGithubWorkspace();
  const queryClient = useQueryClient();
  const [celebrate, setCelebrate] = useState(false);

  const statusQ = useQuery({
    queryKey: ['gh-index', repo?.fullName, projectId],
    queryFn: () => getGithubIndexStatus(clerkId, projectId, repo!.owner, repo!.name),
    enabled: !!repo && !!clerkId,
    refetchInterval: (q) => (q.state.data?.status === 'running' ? 1200 : false),
  });

  const start = useMutation({
    mutationFn: () => indexGithubRepository(clerkId, projectId, repo!.owner, repo!.name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gh-index', repo?.fullName, projectId] }),
  });

  const status = statusQ.data?.status || 'idle';
  const percent = Number(statusQ.data?.percent || 0);
  const indexed = Number(statusQ.data?.indexedCount || 0);
  const files = Number(statusQ.data?.fileCount || 0);

  useEffect(() => {
    if (status === 'complete') {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2400);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!repo) return null;

  return (
    <div className="inline-flex items-center gap-2">
      {status === 'running' && (
        <div className="inline-flex items-center gap-2 pr-2" aria-live="polite">
          <ProgressRing value={percent} size={36} stroke={4} accent="indigo" hideValue />
          <span className="text-[11px] font-semibold text-slate-500">
            {indexed}/{files || '…'} files
          </span>
        </div>
      )}
      <AnimatePresence>
        {celebrate && status === 'complete' && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-8 w-8 rounded-full inline-flex items-center justify-center bg-emerald-500 text-white"
            style={{ boxShadow: '0 0 18px 2px rgba(16,185,129,0.45)' }}
            aria-label="Indexing complete"
          >
            <Check size={14} />
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => start.mutate()}
        disabled={status === 'running' || start.isPending}
        className="h-8 px-3 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 disabled:opacity-50"
      >
        {status === 'running' ? 'Indexing' : 'Index for Neural'}
      </button>
    </div>
  );
}

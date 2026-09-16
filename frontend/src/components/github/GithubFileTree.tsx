import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getGithubTree } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fileIconForPath } from './fileIcons';
import { useGithubWorkspace } from './GithubSelectionContext';

interface TreeEntry {
  name: string;
  path: string;
  type: string;
  size?: number;
}

function TreeDir({
  dirPath,
  depth,
}: {
  dirPath: string;
  depth: number;
}) {
  const { clerkId, projectId, repo, selection, setSelection } = useGithubWorkspace();
  const [open, setOpen] = useState(depth === 0);
  const { data, isLoading, error } = useQuery({
    queryKey: ['gh-tree', repo?.fullName, dirPath],
    queryFn: () => getGithubTree(clerkId, projectId, repo!.owner, repo!.name, dirPath),
    enabled: !!repo && open,
    staleTime: 60_000,
  });
  const entries: TreeEntry[] = data?.entries || [];

  return (
    <div>
      {dirPath !== '' && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="w-full flex items-center gap-1.5 h-8 px-2 rounded-lg text-[13px] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <ChevronRight size={12} className={cn('transition-transform', open && 'rotate-90')} />
          {(() => { const Icon = fileIconForPath(dirPath, true); return <Icon size={14} className="text-amber-500" />; })()}
          <span className="truncate">{dirPath.split('/').pop()}</span>
        </button>
      )}
      {open && (
        <div>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-6 my-2 text-slate-400" />}
          {error && <p className="text-[11px] text-rose-500 px-3">Could not load this folder.</p>}
          {entries.map((entry) =>
            entry.type === 'dir' ? (
              <TreeDir key={entry.path} dirPath={entry.path} depth={depth + (dirPath ? 1 : 0)} />
            ) : (
              <FileRow
                key={entry.path}
                entry={entry}
                depth={depth + (dirPath ? 1 : 0)}
                selected={selection.path === entry.path}
                onOpen={() => setSelection({ path: entry.path, kind: 'file' })}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({
  entry,
  depth,
  selected,
  onOpen,
}: {
  entry: TreeEntry;
  depth: number;
  selected: boolean;
  onOpen: () => void;
}) {
  const Icon = fileIconForPath(entry.path);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
      className={cn(
        'w-full flex items-center gap-1.5 h-8 px-2 rounded-lg text-[13px] text-left',
        selected ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
      )}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <Icon size={14} className="shrink-0 text-violet-500" />
      <span className={cn('truncate', selected && 'font-medium')}>{entry.name}</span>
    </button>
  );
}

export function GithubFileTree() {
  const { repo, setSelection } = useGithubWorkspace();
  const crumbs = useMemo(() => repo?.name || 'repository', [repo]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setSelection({ path: '', kind: 'repo' });
        }}
        className="h-10 px-3 text-[11px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/[0.06] text-left truncate"
      >
        {crumbs}
      </button>
      <div className="flex-1 overflow-auto py-1">
        <TreeDir dirPath="" depth={0} />
      </div>
    </div>
  );
}

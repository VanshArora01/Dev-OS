import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getGithubCommits, getGithubFile, getGithubRelationships } from '@/lib/api';
import { motionFast } from '@/lib/motion';
import { CodeViewer } from './CodeViewer';
import { useGithubWorkspace } from './GithubSelectionContext';

const TABS = ['Code', 'Relationships', 'History', 'PRD'] as const;

export function GithubCodePane({ onAskNeural }: { onAskNeural?: () => void }) {
  const { clerkId, projectId, repo, branch, selection, setSelection } = useGithubWorkspace();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Code');
  const [copied, setCopied] = useState(false);
  const path = selection.kind === 'file' ? selection.path : '';

  const fileQuery = useQuery({
    queryKey: ['gh-file', repo?.fullName, path, branch],
    queryFn: () => getGithubFile(clerkId, projectId, repo!.owner, repo!.name, path, branch),
    enabled: !!repo && !!path,
  });
  const relQuery = useQuery({
    queryKey: ['gh-rel', repo?.fullName, path],
    queryFn: () => getGithubRelationships(clerkId, projectId, repo!.owner, repo!.name, path),
    enabled: !!repo && !!path && (tab === 'Relationships' || tab === 'Neural'),
  });
  const histQuery = useQuery({
    queryKey: ['gh-hist', repo?.fullName, path],
    queryFn: () => getGithubCommits(clerkId, projectId, repo!.owner, repo!.name, { path }),
    enabled: !!repo && !!path && tab === 'History',
  });

  const file = fileQuery.data?.file;
  const rel = relQuery.data?.relationships;

  if (!path) {
    return <div className="p-8 text-sm text-slate-400">Select a file to read source code.</div>;
  }

  const openPath = (next: string) => {
    setSelection({ path: next, kind: 'file' });
    setTab('Code');
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            {path.split('/').pop()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {path} · {file?.language || 'text'} · {branch} {file?.commit?.sha ? `· ${String(file.commit.sha).slice(0, 7)}` : ''}
          </p>
          {file?.commit?.message && <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{file.commit.message}</p>}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Copy file"
            onClick={async () => {
              await navigator.clipboard.writeText(file?.content || '');
              setCopied(true);
              setTimeout(() => setCopied(false), 1000);
            }}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {onAskNeural && (
          <button type="button" onClick={onAskNeural} className="h-8 px-3 rounded-full bg-brand text-white text-[11px] font-semibold inline-flex items-center gap-1">
            <Sparkles size={12} /> Ask Neural
          </button>
          )}
        </div>
      </div>
      <div className="px-3 pt-2 flex gap-1">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold ${tab === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={motionFast} className="h-full">
            {tab === 'Code' && (
              <CodeViewer
                path={path}
                language={file?.language}
                content={file?.content || ''}
                binary={file?.binary}
                tooLarge={file?.tooLarge}
                line={selection.line}
              />
            )}
            {tab === 'Relationships' && (
              <div className="p-4 space-y-4 overflow-auto h-full text-sm">
                {rel?.status === 'unsupported' && (
                  <p className="text-slate-500">Relationships not yet mapped for this file.</p>
                )}
                {rel?.status === 'analyzed' && (
                  <>
                    <RelList title="Imports" items={rel.imports || []} onOpen={openPath} empty="This file has no in-repo imports." />
                    <RelList title="Used by" items={rel.usedBy || []} onOpen={openPath} empty="Nothing analyzed yet imports this file." />
                    {(rel.relatedPaths || []).length > 0 && (
                      <RelList
                        title="Changed together"
                        items={(rel.relatedPaths || []).map((item: { path?: string } | string) => typeof item === 'string' ? item : item.path)}
                        onOpen={openPath}
                        empty=""
                      />
                    )}
                  </>
                )}
              </div>
            )}
            {tab === 'History' && (
              <div className="p-3 overflow-auto h-full space-y-2">
                {(histQuery.data?.commits || []).map((c: any) => (
                  <button
                    key={c.sha}
                    type="button"
                    onClick={() => { setSelection({ path, kind: 'commit', sha: c.sha }); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  >
                    <p className="text-sm font-medium line-clamp-2">{c.message}</p>
                    <p className="text-[11px] text-slate-400">{c.author} · {c.shortSha}</p>
                  </button>
                ))}
              </div>
            )}
            {tab === 'PRD' && (
              <div className="p-4 text-sm text-slate-500">Not yet linked to a requirement.</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RelList({ title, items, onOpen, empty }: { title: string; items: string[]; onOpen: (path: string) => void; empty: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      {items.length === 0 && empty && <p className="text-slate-500 text-xs">{empty}</p>}
      <div className="space-y-1">
        {items.filter(Boolean).slice(0, 20).map((item) => (
          <button key={item} type="button" onClick={() => item.includes('/') || item.startsWith('.') ? onOpen(item) : undefined} className="block text-left text-xs px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] truncate w-full">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

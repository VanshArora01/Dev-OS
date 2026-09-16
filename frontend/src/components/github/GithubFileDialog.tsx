import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getGithubRelationships } from '@/lib/api';
import { GithubIntelligence } from './GithubIntelligence';
import { GraphNodeCard } from './GraphNodeCard';
import { NODE_COLORS, graphKindForPath } from './fileIcons';
import { useGithubWorkspace } from './GithubSelectionContext';

const nodeTypes = { gh: GraphNodeCard };

export function GithubFileDialog({
  path,
  onClose,
  onOpenFile,
}: {
  path: string | null;
  onClose: () => void;
  onOpenFile?: (next: string) => void;
}) {
  const { clerkId, projectId, repo, setSelection } = useGithubWorkspace();
  const [askOpen, setAskOpen] = useState(false);

  const relQuery = useQuery({
    queryKey: ['gh-rel', repo?.fullName, path],
    queryFn: () => getGithubRelationships(clerkId, projectId, repo!.owner, repo!.name, path!),
    enabled: !!repo && !!path,
  });

  const rel = relQuery.data?.relationships;
  const imports = (rel?.imports || []).filter((p: string) => typeof p === 'string' && (p.includes('/') || p.startsWith('.'))).slice(0, 10);
  const usedBy = (rel?.usedBy || []).slice(0, 10);

  const { nodes, edges } = useMemo(() => {
    if (!path) return { nodes: [] as Node[], edges: [] as Edge[] };
    const ns: Node[] = [
      {
        id: path,
        type: 'gh',
        position: { x: 240, y: 140 },
        data: { label: path.split('/').pop(), kind: graphKindForPath(path), path, selected: true },
        draggable: false,
      },
      ...imports.map((item: string, i: number) => ({
        id: `imp-${item}`,
        type: 'gh',
        position: { x: 20, y: 20 + i * 64 },
        data: { label: item.split('/').pop() || item, kind: graphKindForPath(item), path: item },
        draggable: false,
      })),
      ...usedBy.map((item: string, i: number) => ({
        id: `use-${item}`,
        type: 'gh',
        position: { x: 460, y: 20 + i * 64 },
        data: { label: item.split('/').pop() || item, kind: graphKindForPath(item), path: item },
        draggable: false,
      })),
    ];
    const es: Edge[] = [
      ...imports.map((item: string) => ({
        id: `e-imp-${item}`,
        source: path,
        target: `imp-${item}`,
        animated: true,
        style: { stroke: NODE_COLORS.source },
        markerEnd: { type: MarkerType.ArrowClosed, color: NODE_COLORS.source, width: 16, height: 16 },
      })),
      ...usedBy.map((item: string) => ({
        id: `e-use-${item}`,
        source: `use-${item}`,
        target: path,
        animated: true,
        style: { stroke: NODE_COLORS.module },
        markerEnd: { type: MarkerType.ArrowClosed, color: NODE_COLORS.module, width: 16, height: 16 },
      })),
    ];
    return { nodes: ns, edges: es };
  }, [path, imports, usedBy]);

  return (
    <Dialog open={!!path} onOpenChange={(open) => { if (!open) { setAskOpen(false); onClose(); } }}>
      <DialogContent className="max-w-3xl h-[min(80vh,720px)] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="truncate">{path?.split('/').pop()}</DialogTitle>
          <p className="text-[11px] text-slate-400 truncate">{path}</p>
        </DialogHeader>
        <div className="px-6 pb-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Imports ← file → used by</span>
          <button
            type="button"
            onClick={() => setAskOpen((v) => !v)}
            className="ml-auto h-8 px-3 rounded-full bg-brand text-white text-[11px] font-semibold inline-flex items-center gap-1"
          >
            <Sparkles size={12} /> Ask about this file
          </button>
        </div>
        <div className="flex-1 min-h-0 px-4 pb-4 grid gap-3" style={{ gridTemplateRows: askOpen ? '1fr 220px' : '1fr' }}>
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden min-h-[220px]">
            {relQuery.isLoading && <p className="p-4 text-sm text-slate-400">Loading relationships…</p>}
            {rel?.status === 'unsupported' && (
              <p className="p-4 text-sm text-slate-500">Relationships not yet mapped for this file.</p>
            )}
            {rel?.status === 'analyzed' && imports.length === 0 && usedBy.length === 0 && (
              <p className="p-4 text-sm text-slate-500">This file has no in-repo imports or dependents in the analyzed set.</p>
            )}
          {rel?.status === 'analyzed' && (imports.length > 0 || usedBy.length > 0) && (
              <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                panOnDrag
                zoomOnScroll
                nodesDraggable={false}
                nodesConnectable={false}
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) => {
                  const next = String(node.data.path || '');
                  if (next && next !== path) {
                    setSelection({ path: next, kind: 'file' });
                    onOpenFile?.(next);
                  }
                }}
                minZoom={0.4}
                maxZoom={1.4}
              >
                <Background gap={18} size={1} />
                <Controls showInteractive={false} position="bottom-right" />
              </ReactFlow>
              </ReactFlowProvider>
            )}
          </div>
          {askOpen && (
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden min-h-0">
              <GithubIntelligence compact chatOnly />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getGithubTree } from '@/lib/api';
import { useGithubWorkspace } from './GithubSelectionContext';
import { GraphNodeCard } from './GraphNodeCard';
import { GithubFileDialog } from './GithubFileDialog';
import { mergeGraphPositions, useLayoutedElements } from './useLayoutedElements';
import {
  HIERARCHY_NODE_CAP,
  MINIMAP_THRESHOLD,
  graphKindForPath,
  type GraphNodeKind,
} from './fileIcons';

const nodeTypes = { gh: GraphNodeCard };
const ROOT_ID = '__repo_root__';
const CHILD_CAP = 24;
const EDGE_STROKE = '#94a3b8';

const defaultEdgeOptions = {
  type: 'default' as const,
  animated: false,
  style: { stroke: EDGE_STROKE, strokeWidth: 1.75 },
  markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_STROKE, width: 16, height: 16 },
};

function GraphFlow() {
  const { clerkId, projectId, repo, branch, setSelection } = useGithubWorkspace();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['']));
  const [dialogPath, setDialogPath] = useState<string | null>(null);
  const [capped, setCapped] = useState(false);

  const rootQuery = useQuery({
    queryKey: ['gh-tree', repo?.fullName, '', branch],
    queryFn: () => getGithubTree(clerkId, projectId, repo!.owner, repo!.name, ''),
    enabled: !!repo,
    staleTime: 60_000,
  });

  const expandedKey = useMemo(() => [...expanded].sort().join('|'), [expanded]);
  const expandedDirs = useMemo(() => [...expanded].filter((d) => d !== ''), [expanded]);
  const childQueries = useQueries({
    queries: expandedDirs.map((dir) => ({
      queryKey: ['gh-tree', repo?.fullName, dir, branch],
      queryFn: () => getGithubTree(clerkId, projectId, repo!.owner, repo!.name, dir),
      enabled: !!repo,
      staleTime: 60_000,
    })),
  });
  const childStamp = childQueries.map((q) => `${q.dataUpdatedAt}:${(q.data?.entries || []).length}`).join(',');

  const childrenByDir = useMemo(() => {
    const map = new Map<string, { path: string; name: string; type: string }[]>();
    map.set('', rootQuery.data?.entries || []);
    expandedDirs.forEach((dir, i) => {
      map.set(dir, childQueries[i]?.data?.entries || []);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootQuery.dataUpdatedAt, childStamp, expandedKey]);

  const topology = useMemo(() => {
    if (!repo) return { nodes: [] as Node[], edges: [] as Edge[], capped: false, key: '' };
    const nodes: Node[] = [{
      id: ROOT_ID,
      type: 'gh',
      position: { x: 0, y: 0 },
      data: {
        label: repo.name,
        kind: 'repo' as GraphNodeKind,
        path: '',
        selected: true,
        expanded: true,
      },
    }];
    const edges: Edge[] = [];
    let overflow = false;

    const visit = (parentId: string, dirPath: string) => {
      if (!expanded.has(dirPath) && dirPath !== '') return;
      const entries = childrenByDir.get(dirPath) || [];
      const visible = entries.slice(0, CHILD_CAP);
      if (entries.length > CHILD_CAP) overflow = true;
      visible.forEach((entry, i) => {
        const kind = graphKindForPath(entry.path, entry.type === 'dir' ? 'dir' : 'file');
        const parent = nodes.find((n) => n.id === parentId);
        nodes.push({
          id: entry.path,
          type: 'gh',
          position: { x: 0, y: 0 },
          data: {
            label: entry.name,
            kind,
            path: entry.path,
            expanded: expanded.has(entry.path),
          },
        });
        edges.push({
          id: `e-${parentId}-${entry.path}`,
          source: parentId,
          target: entry.path,
          ...defaultEdgeOptions,
        });
        if (entry.type === 'dir' && expanded.has(entry.path)) visit(entry.path, entry.path);
      });
    };

    visit(ROOT_ID, '');
    overflow = overflow || nodes.length > HIERARCHY_NODE_CAP;
    const trimmed = nodes.slice(0, HIERARCHY_NODE_CAP);
    const ids = new Set(trimmed.map((n) => n.id));
    return {
      nodes: trimmed,
      edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
      capped: overflow,
      key: trimmed.map((n) => n.id).join('|') + '::' + edges.map((e) => e.id).join('|'),
    };
  }, [repo, expanded, childrenByDir]);

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  useEffect(() => {
    setNodes((prev) => mergeGraphPositions(prev, topology.nodes));
    setEdges(topology.edges);
    setCapped(topology.capped);
  }, [topology, setEdges, setNodes]);

  const { setDragging } = useLayoutedElements(topology.key, nodes.length > 0);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.id === ROOT_ID) return;
    const path = String(node.data.path || '');
    const kind = node.data.kind as GraphNodeKind;
    if (kind === 'folder') {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
      return;
    }
    if (kind === 'external') return;
    setDialogPath(path);
    setSelection({ path, kind: 'file' });
  }, [setSelection]);

  if (!repo) return null;

  return (
    <div className="h-full min-h-0 relative bg-slate-50/40 dark:bg-black/20">
      {capped && (
        <div className="absolute z-10 top-3 left-3 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 border border-slate-200 dark:border-white/10">
          Showing top {HIERARCHY_NODE_CAP} — collapse folders to refine
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStart={(_, node) => setDragging(node.id)}
        onNodeDragStop={() => setDragging(null)}
        defaultEdgeOptions={defaultEdgeOptions}
        elementsSelectable
        nodesConnectable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.35}
        maxZoom={1.6}
        fitView
      >
        <Background gap={22} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
        {nodes.length > MINIMAP_THRESHOLD && <MiniMap pannable zoomable position="top-right" />}
      </ReactFlow>
      <GithubFileDialog path={dialogPath} onClose={() => setDialogPath(null)} onOpenFile={setDialogPath} />
    </div>
  );
}

export function GithubGraph() {
  return (
    <ReactFlowProvider>
      <GraphFlow />
    </ReactFlowProvider>
  );
}

import { useCallback, useEffect } from 'react';
import dagre from 'dagre';
import { useNodesInitialized, useReactFlow, type Edge, type Node } from '@xyflow/react';

const nodeWidth = 220;
const nodeHeight = 60;

export function useLayoutedElements(topologyKey: string, enabled = true) {
  const { getNodes, setNodes, getEdges } = useReactFlow();
  const initialized = useNodesInitialized();

  const start = useCallback(() => {
    if (!enabled || !initialized) return;

    const rfNodes = getNodes();
    const rfEdges = getEdges();
    if (!rfNodes.length) return;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // rankdir: 'LR' for Left-to-Right layout, 'TB' for Top-to-Bottom
    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 80, nodesep: 30 });

    rfNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    rfEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    setNodes((nodes: Node[]) =>
      nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (!nodeWithPosition) return node;
        return {
          ...node,
          // Position relative to top-left of node
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };
      })
    );
  }, [enabled, getEdges, getNodes, initialized, setNodes]);

  useEffect(() => {
    if (!enabled || !initialized || !topologyKey) return;
    // A slight delay ensures elements are painted if needed, but synchronous usually works for React Flow
    start();
  }, [enabled, initialized, topologyKey, start]);

  const stop = useCallback(() => {}, []);
  const setDragging = useCallback((id: string | null) => {}, []);

  return { restart: start, stop, setDragging };
}

export function mergeGraphPositions(prev: Node[], next: Node[]): Node[] {
  // Discard previous positions since dagre creates an absolute deterministic layout each time
  return next;
}

export type { Edge, Node };


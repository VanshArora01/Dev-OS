import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, useReducedMotion } from 'framer-motion';
import { NODE_COLORS, NODE_ICONS, type GraphNodeKind } from './fileIcons';

export const GraphNodeCard = memo(function GraphNodeCard({
  data,
}: {
  data: { label: string; kind: GraphNodeKind; path: string; selected?: boolean; expanded?: boolean };
}) {
  const reduce = useReducedMotion();
  const Icon = NODE_ICONS[data.kind];
  const color = NODE_COLORS[data.kind];
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="!w-2 !h-2 !border-0 !bg-transparent"
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="px-3 py-2 rounded-xl border bg-white dark:bg-[#16161f] shadow-sm min-w-[140px] max-w-[200px]"
        style={{
          borderColor: data.selected || data.expanded ? color : 'rgba(148,163,184,0.25)',
          boxShadow: data.selected || data.expanded ? `0 0 0 1px ${color}55, 0 8px 24px -10px ${color}` : undefined,
        }}
      >
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <span className="text-[12px] font-semibold truncate">{data.label}</span>
        </div>
      </motion.div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="!w-2 !h-2 !border-0 !bg-transparent"
      />
    </div>
  );
});

import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Code2, GitFork, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionSpring } from '@/lib/motion';
import type { GithubCanvasMode } from './GithubSelectionContext';

const MODES: { id: GithubCanvasMode; label: string; icon: typeof Code2 }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'graph', label: 'Graph', icon: GitFork },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export function GithubModeSwitcher({
  value,
  onChange,
}: {
  value: GithubCanvasMode;
  onChange: (mode: GithubCanvasMode) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative inline-flex items-center gap-0.5 p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
      {MODES.map((mode) => {
        const active = value === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={active}
            aria-label={mode.label}
            onClick={() => onChange(mode.id)}
            className={cn(
              'relative z-10 h-8 px-3.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5',
              active ? 'text-white' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100'
            )}
          >
            {active && (
              <motion.span
                layoutId="github-mode-pill"
                className="absolute inset-0 rounded-full bg-brand"
                style={{
                  boxShadow: '0 4px 14px -2px rgba(108, 92, 231, 0.55), 0 0 18px 1px rgba(108, 92, 231, 0.28)',
                }}
                transition={reduce ? { duration: 0.16 } : { ...motionSpring, stiffness: 380, damping: 26 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Icon size={13} strokeWidth={active ? 2.4 : 2} />
              <span className="hidden sm:inline">{mode.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

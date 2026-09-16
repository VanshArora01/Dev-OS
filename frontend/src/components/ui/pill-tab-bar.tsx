import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PillTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface PillTabBarProps {
  tabs: readonly PillTab[] | PillTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function PillTabBar({
  tabs,
  activeId,
  onChange,
  className,
  layoutId = "pill-tab-active",
}: PillTabBarProps) {
  return (
    <div className={cn("pill-track", className)}>
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-sm font-medium whitespace-nowrap z-10",
              active
                ? "text-white"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-brand shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon size={14} className={active ? "opacity-100" : "opacity-70"} />}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

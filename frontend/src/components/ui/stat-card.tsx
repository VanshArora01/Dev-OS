import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Accent } from "@/lib/accents";
import { IconChip } from "@/components/ui/icon-chip";
import { BentoCard, type BentoVariant } from "@/components/ui/bento-card";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { Sparkline } from "@/components/ui/sparkline";

const SPARK_COLORS: Record<Accent, string> = {
  violet: "#6C5CE7",
  indigo: "#6366F1",
  amber: "#F59E0B",
  emerald: "#10B981",
  coral: "#F43F5E",
  sky: "#0EA5E9",
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
  icon?: LucideIcon;
  variant?: BentoVariant;
  className?: string;
  span?: string;
  sparkline?: number[];
}

export function StatCard({
  label,
  value,
  hint,
  accent = "violet",
  icon,
  variant = "neutral",
  className,
  span = "col-span-12 sm:col-span-6 xl:col-span-3",
  sparkline,
}: StatCardProps) {
  const numeric = typeof value === "number";
  const counted = useAnimatedCounter(numeric ? value : 0, 900, numeric);
  const filled = variant === "filled" || variant === "spotlight";

  return (
    <BentoCard
      variant={variant}
      accent={accent}
      span={span}
      className={cn("relative flex flex-col gap-3 min-h-[148px] overflow-hidden", className)}
    >
      <div className="flex items-start justify-between gap-2 relative z-10">
        {icon ? (
          <IconChip
            icon={icon}
            accent={accent}
            size="sm"
            className={filled ? "bg-white/20 text-white" : undefined}
          />
        ) : (
          <p className={cn("text-sm font-medium", filled ? "text-white/80" : "text-slate-500 dark:text-zinc-400")}>
            {label}
          </p>
        )}
        <span
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center",
            filled ? "bg-white/15 text-white" : "bg-slate-100 dark:bg-white/[0.06] text-slate-400"
          )}
        >
          <ArrowUpRight size={13} />
        </span>
      </div>
      {icon && (
        <p className={cn("text-sm font-medium relative z-10", filled ? "text-white/80" : "text-slate-500 dark:text-zinc-400")}>
          {label}
        </p>
      )}
      <p
        className={cn(
          "font-heading text-[28px] font-bold tabular-nums tracking-tight leading-none relative z-10",
          filled ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        {numeric ? counted : value}
      </p>
      {hint ? (
        <p className={cn("text-xs relative z-10", filled ? "text-white/70" : "text-slate-400")}>{hint}</p>
      ) : null}
      {sparkline && sparkline.length > 1 && (
        <div className={cn("absolute inset-x-0 bottom-0 opacity-80", filled && "opacity-40")}>
          <Sparkline
            data={sparkline}
            color={filled ? "rgba(255,255,255,0.9)" : SPARK_COLORS[accent]}
            height={56}
          />
        </div>
      )}
    </BentoCard>
  );
}

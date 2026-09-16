import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { accentBar, accentTrack, type Accent } from "@/lib/accents";

interface AnimatedProgressProps {
  value: number;
  accent?: Accent;
  className?: string;
  showShimmer?: boolean;
}

/** Magic UI–style progress: fills on mount with optional shimmer. */
export function AnimatedProgress({
  value,
  accent = "violet",
  className,
  showShimmer = true,
}: AnimatedProgressProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 w-full rounded-full overflow-hidden", accentTrack[accent], className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-full relative overflow-hidden", accentBar[accent])}
      >
        {showShimmer && (
          <span className="absolute inset-0 animate-shimmer opacity-40 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        )}
      </motion.div>
    </div>
  );
}

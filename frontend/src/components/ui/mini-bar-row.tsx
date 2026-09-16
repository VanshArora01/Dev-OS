import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { accentBar, accentTrack, type Accent } from "@/lib/accents";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MiniBarRowProps {
  values: number[];
  labels?: string[];
  details?: string[][];
  accent?: Accent;
  className?: string;
}

const ACCENTS: Accent[] = ["violet", "amber", "emerald", "sky", "coral", "indigo", "violet"];

export function MiniBarRow({ values, labels, details, accent, className }: MiniBarRowProps) {
  const max = Math.max(...values, 1);
  const [openDay, setOpenDay] = useState<number | null>(null);

  return (
    <div className={cn("flex items-end gap-3 h-44 w-full", className)}>
      {values.map((value, i) => {
        const color = accent || ACCENTS[i % ACCENTS.length];
        const pct = Math.max(12, (value / max) * 100);
        const dayDetails = details?.[i] || [];

        return (
          <Popover
            key={i}
            open={openDay === i}
            onOpenChange={(open) => setOpenDay(open ? i : null)}
          >
            <Tooltip delayDuration={120}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex-1 flex flex-col items-center gap-2 min-w-0 h-full group focus:outline-none"
                  >
                    <div
                      className={cn(
                        "w-full flex-1 max-w-[56px] rounded-full overflow-hidden flex items-end transition-shadow",
                        accentTrack[color],
                        openDay === i && "ring-2 ring-brand/40 shadow-glow"
                      )}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 220,
                          damping: 22,
                          delay: i * 0.07,
                        }}
                        whileHover={{ filter: "brightness(1.08)" }}
                        className={cn("w-full rounded-full origin-bottom", accentBar[color])}
                      />
                    </div>
                    {labels?.[i] && (
                      <span className="text-xs font-semibold text-slate-500 group-hover:text-brand transition-colors">
                        {labels[i]}
                      </span>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={value}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] tabular-nums text-slate-400"
                      >
                        {value}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl text-xs">
                {value} session{value === 1 ? "" : "s"} on {labels?.[i] || "this day"}
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-56 rounded-2xl p-3" side="top">
              <p className="text-xs font-semibold text-slate-500 mb-2">{labels?.[i]} sessions</p>
              {dayDetails.length === 0 ? (
                <p className="text-sm text-slate-400">No session notes logged.</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayDetails.map((line, idx) => (
                    <li key={idx} className="text-sm text-slate-700 dark:text-zinc-200 truncate">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

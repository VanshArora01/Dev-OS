import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { accentFill, type Accent } from "@/lib/accents";

export type BentoVariant = "neutral" | "filled" | "spotlight";

interface BentoCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  variant?: BentoVariant;
  accent?: Accent;
  span?: string;
  className?: string;
  children: ReactNode;
  hoverLift?: boolean;
}

export function BentoCard({
  variant = "neutral",
  accent = "violet",
  span,
  className,
  children,
  hoverLift = true,
  ...rest
}: BentoCardProps) {
  return (
    <motion.div
      whileHover={hoverLift ? { y: -3 } : undefined}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "p-6",
        variant === "neutral" && "surface-card text-slate-800 dark:text-zinc-100",
        variant === "filled" && cn("bento-filled", accentFill[accent]),
        variant === "spotlight" && "bento-spotlight",
        span,
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

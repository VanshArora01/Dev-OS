import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { accentRing, type Accent } from "@/lib/accents";

interface ProgressRingProps {
    value: number;
    size?: number;
    stroke?: number;
    accent?: Accent;
    label?: string;
    inverted?: boolean;
    hideValue?: boolean;
    className?: string;
}

export function ProgressRing({
    value,
    size = 148,
    stroke = 12,
    accent = "violet",
    label,
    inverted,
    hideValue,
    className,
}: ProgressRingProps) {
    const pct = Math.max(0, Math.min(100, value));
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const progress = useMotionValue(0);
    const dash = useTransform(progress, (v) => circ - (v / 100) * circ);

    useEffect(() => {
        const controls = animate(progress, pct, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
        return controls.stop;
    }, [pct, progress]);

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className={inverted ? "stroke-white/15" : "stroke-slate-100 dark:stroke-zinc-800"}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    style={{ strokeDashoffset: dash }}
                    className={inverted ? "stroke-white" : accentRing[accent]}
                />
            </svg>
            {!hideValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-heading text-3xl font-bold tabular-nums", inverted ? "text-white" : "text-slate-900 dark:text-white")}>
                    {Math.round(pct)}%
                </span>
                {label && (
                    <span className={cn("text-[11px] mt-0.5", inverted ? "text-white/60" : "text-slate-400")}>{label}</span>
                )}
            </div>
            )}
        </div>
    );
}

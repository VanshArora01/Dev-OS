import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    glowColor?: string;
    delay?: number;
}

export default function GlassCard({
    icon,
    title,
    description,
    children,
    className = "",
    glowColor = "192 100% 50%",
    delay = 0,
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-700 hover:border-white/[0.15] hover:bg-white/[0.06] ${className}`}
            style={{
                boxShadow: `0 0 0 1px hsl(${glowColor} / 0.03), 0 8px 40px -12px hsl(${glowColor} / 0.05)`,
            }}
            whileHover={{
                boxShadow: `0 0 0 1px hsl(${glowColor} / 0.12), 0 16px 70px -18px hsl(${glowColor} / 0.25), 0 0 90px -24px hsl(${glowColor} / 0.18)`,
                y: -10,
                rotateX: 4,
                rotateY: -4,
            }}
            whileTap={{ scale: 0.97, y: 0, rotateX: 0, rotateY: 0 }}
        >
            {/* Animated gradient border overlay on hover */}
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                    background: `linear-gradient(135deg, hsl(${glowColor} / 0.08) 0%, transparent 40%, transparent 60%, hsl(${glowColor} / 0.05) 100%)`,
                }}
            />

            {/* Floating particle dot */}
            <div
                className="pointer-events-none absolute -right-1 -top-1 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-40"
                style={{ background: `hsl(${glowColor})` }}
            />

            <div className="relative z-10">
                {icon && (
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 transition-all duration-500 group-hover:border-white/[0.15] group-hover:text-white group-hover:shadow-lg"
                        style={{ boxShadow: `0 0 20px -8px hsl(${glowColor} / 0)` }}
                    >
                        {icon}
                    </div>
                )}
                <h3 className="font-heading text-lg font-semibold tracking-tight text-white/95">
                    {title}
                </h3>
                {description && (
                    <p className="mt-2 text-sm leading-relaxed text-white/50 transition-colors duration-500 group-hover:text-white/65">
                        {description}
                    </p>
                )}
                {children}
            </div>
        </motion.div>
    );
}

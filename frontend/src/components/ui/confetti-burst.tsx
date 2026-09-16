import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#6C5CE7", "#A78BFA", "#34D399", "#FBBF24", "#FB7185", "#38BDF8"];

interface ConfettiBurstProps {
  seed?: number;
}

export function ConfettiBurst({ seed = 0 }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + seed * 0.1;
        const dist = 36 + ((i * 17 + seed) % 40);
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 12,
          rotate: (i * 47 + seed) % 360,
          color: COLORS[i % COLORS.length],
          size: 4 + (i % 3),
        };
      }),
    [seed]
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-20">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

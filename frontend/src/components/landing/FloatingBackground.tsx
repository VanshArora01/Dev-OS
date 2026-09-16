import { motion } from "framer-motion";

export default function FloatingBackground() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* Ambient gradients */}
            <motion.div
                className="absolute -left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[120px]"
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 50, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute -right-[10%] top-[40%] h-[600px] w-[600px] rounded-full bg-purple-500/[0.08] blur-[130px]"
                animate={{
                    x: [0, -80, 40, 0],
                    y: [0, 60, -60, 0],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute left-[30%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-blue-500/[0.05] blur-[110px]"
                animate={{
                    x: [0, 40, -40, 0],
                    y: [0, -30, 30, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />
        </div>
    );
}

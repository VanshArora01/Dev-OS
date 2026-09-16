import { motion } from "framer-motion";
import {
    Sparkles,
    Code2,
    MousePointerClick,
    CheckCircle2,
} from "lucide-react";

const features = [
    {
        icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
        text: "AI-generated Boilerplate Selection",
    },
    {
        icon: <Code2 className="h-5 w-5 text-emerald-400" />,
        text: "Human-verified Component Library",
    },
    {
        icon: <MousePointerClick className="h-5 w-5 text-purple-400" />,
        text: "Instant API Mocking and Orchestration",
    },
    {
        icon: <CheckCircle2 className="h-5 w-5 text-amber-400" />,
        text: "Automated Deployment Workflows",
    },
];

const codeLines = [
    { indent: 0, color: "text-cyan-400/70", text: "devos.orchestrate({" },
    { indent: 1, color: "text-white/60", text: 'stack: "Next.js + Prisma",' },
    { indent: 1, color: "text-white/60", text: 'auth: "Clerk",' },
    { indent: 1, color: "text-emerald-400/70", text: 'design: "Premium Noir",' },
    { indent: 1, color: "text-purple-400/70", text: 'features: ["CRUD", "Real-time"],' },
    { indent: 0, color: "text-cyan-400/70", text: "});" },
    { indent: 0, color: "text-white/30", text: "" },
    { indent: 0, color: "text-white/40", text: "// Response (180ms)" },
    { indent: 0, color: "text-amber-400/70", text: "→ structure_ready: true" },
    { indent: 0, color: "text-emerald-400/70", text: '→ status: "awaiting_verification"' },
    { indent: 0, color: "text-white/50", text: "→ preview_url: devos.app/p/demo" },
];

export default function AIFeatureShowcase() {
    return (
        <section className="relative z-10 overflow-hidden px-6 py-32 md:px-12 bg-black">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/4 blur-[120px]" />
                <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-white/3 blur-[100px]" />
            </div>

            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400/80">
                        AI Orchestration
                    </p>
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                        Architect and deploy with{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            AI Precision
                        </span>
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-white/50">
                        DevOS bridges the gap between AI generation and production code.
                        Our orchestration engine builds verified structures that follow industry best practices.
                    </p>

                    <div className="mt-8 space-y-4">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.text}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-3"
                            >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                                    {f.icon}
                                </div>
                                <span className="text-sm leading-relaxed text-white/70">
                                    {f.text}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 40, rotateY: -5 }}
                    whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9 }}
                    className="relative"
                >
                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-white/25 via-transparent to-white/5 blur-xl" />

                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-3xl">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                            <div className="h-2 w-2 rounded-full bg-red-400/60" />
                            <div className="h-2 w-2 rounded-full bg-amber-400/60" />
                            <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
                            <span className="ml-3 text-[10px] text-white/30 font-mono">
                                devos.config.ts
                            </span>
                        </div>

                        <div className="p-6 font-mono text-[13px] leading-[1.8]">
                            {codeLines.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
                                    className={`${line.color}`}
                                    style={{ paddingLeft: `${line.indent * 20}px` }}
                                >
                                    {line.text || "\u00A0"}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
    Zap,
    Shield,
    Cpu,
    Layers,
    Activity,
    Database,
    Code2,
    LayoutDashboard,
    Timer,
    History,
    Link as LinkIcon,
    CheckCircle2
} from "lucide-react";

export default function BentoFeatures() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { damping: 25, stiffness: 200 });
    const springY = useSpring(mouseY, { damping: 25, stiffness: 200 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative z-10 px-6 py-32 md:px-12 group/section bg-black"
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover/section:opacity-100 transition-opacity duration-500 z-0"
                style={{
                    background: `radial-gradient(1200px circle at ${springX}px ${springY}px, rgba(255,255,255,0.06), transparent 80%)`
                }}
            />

            <div className="mx-auto max-w-7xl relative z-10">
                <div className="mb-20 text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-blue-400"
                    >
                        Work Smarter, Not Harder
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-extrabold tracking-tighter text-white md:text-6xl lg:text-7xl"
                    >
                        Never Lose <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Momentum</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-4 gap-6">
                    {/* Primary Feature: Continuity */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="md:col-span-2 md:row-span-4 relative group/card overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-12 flex flex-col justify-between h-[600px] md:h-full transition-all duration-700 hover:border-blue-500/40"
                    >
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                            <Activity size={800} className="absolute -right-40 -top-40 text-blue-400 opacity-20" />
                        </div>

                        <div className="relative">
                            <div className="p-5 w-fit rounded-[2rem] bg-blue-500/10 border border-blue-500/20 mb-10">
                                <Timer className="text-blue-400 h-10 w-10" />
                            </div>
                            <h3 className="text-4xl font-black text-white mb-8 leading-[1.1] tracking-tighter">Project Focus &<br />Session Continuity</h3>
                            <p className="text-xl text-white/40 max-w-sm leading-relaxed font-medium">
                                Track exactly what you're doing, when you did it, and what comes next. Built for deep work.
                            </p>
                        </div>

                        <div className="relative pt-12">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/[0.05]">
                                    <Layers className="text-blue-400 h-6 w-6 mb-3" />
                                    <div className="text-white font-black text-2xl tracking-tighter">Logs</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-2 font-bold">Chronological</div>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/[0.05]">
                                    <Zap className="text-amber-400 h-6 w-6 mb-3" />
                                    <div className="text-white font-black text-2xl tracking-tighter">Session</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-2 font-bold">Live Tracking</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Dashboard Card */}
                    <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-10 transition-all duration-500">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1">
                                <div className="p-4 w-fit rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6 font-mono text-purple-400 text-xs uppercase">
                                    Developer Center
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Unified Control Center</h3>
                                <p className="text-white/40 leading-relaxed text-sm">
                                    Manage multiple projects with a single premium interface designed for high-intensity development.
                                </p>
                            </div>
                            <LayoutDashboard size={100} className="text-purple-400 opacity-20" />
                        </div>
                    </div>

                    {/* Resources Wide */}
                    <div className="md:col-span-2 relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-8 flex items-center gap-8 transition-all duration-500">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <LinkIcon className="text-emerald-400 h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">Project Resource Links</h3>
                            <p className="text-sm text-white/40">Keep documentation, repos, and designs one click away per project.</p>
                        </div>
                    </div>

                    {/* Small Utility Cards */}
                    <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-8 transition-all duration-500">
                        <History size={32} className="text-amber-400 mb-6 text-opacity-50" />
                        <h4 className="text-white font-bold mb-2">Full History</h4>
                        <p className="text-xs text-white/40 leading-relaxed font-medium">Never forget what you did last Tuesday.</p>
                    </div>

                    <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-8 transition-all duration-500">
                        <CheckCircle2 size={32} className="text-blue-400 mb-6 text-opacity-50" />
                        <h4 className="text-white font-bold mb-2">Micro Tasks</h4>
                        <p className="text-xs text-white/40 leading-relaxed font-medium">Stay intentional with small, actionable steps.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

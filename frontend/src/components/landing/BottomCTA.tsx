import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BottomCTA() {
    return (
        <section className="relative z-10 overflow-hidden px-6 py-32 md:px-12 bg-black">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative mx-auto max-w-4xl"
            >
                <div className="absolute -inset-px rounded-[3rem] bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm" />

                <div className="relative overflow-hidden rounded-[3rem] border border-white/[0.1] bg-white/[0.02] px-8 py-20 text-center backdrop-blur-xl sm:px-16">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-blue-400"
                    >
                        Ready to level up?
                    </motion.p>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        className="text-4xl font-black tracking-tight text-white md:text-6xl uppercase italic"
                    >
                        Never Lose{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Context Again.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mx-auto mt-6 max-w-lg text-sm text-white/40 leading-relaxed font-medium"
                    >
                        Join developers who use DevOS to stay intentional, track their progress,
                        and eliminate the mental tax of context switching.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
                    >
                        <motion.button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative overflow-hidden rounded-2xl bg-white px-10 py-4 text-xs font-black uppercase tracking-widest text-black shadow-2xl transition-all"
                        >
                            Get Started Now
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}

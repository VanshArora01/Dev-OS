import { motion } from "framer-motion";

const stats = [
    { label: "Active Sessions", value: "48K+", sub: "Logged this month" },
    { label: "Context Saved", value: "92%", sub: "User retention" },
    { label: "Focus Minutes", value: "1.2M", sub: "Calculated" },
    { label: "Recovery Time", value: "0s", sub: "Workspace resume" },
];

export default function StatsSection() {
    return (
        <section className="relative z-10 px-6 py-24 md:px-12 bg-black">
            <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="flex flex-col items-center text-center lg:items-start lg:text-left"
                        >
                            <span className="text-4xl font-black tracking-tighter text-white md:text-5xl lg:text-6xl italic">
                                {stat.value}
                            </span>
                            <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                {stat.label}
                            </span>
                            <span className="mt-1 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                {stat.sub}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

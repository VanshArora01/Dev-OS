import { motion } from "framer-motion";
import { Github, Linkedin, Database, Cloud, ExternalLink } from "lucide-react";

export default function QuickLinks() {
    const links = [
        { name: "GitHub", url: "https://github.com", icon: Github, color: "text-slate-900 bg-slate-100 dark:bg-slate-50 border-slate-200" },
        { name: "LinkedIn", url: "https://linkedin.com", icon: Linkedin, color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" },
        { name: "MongoDB Atlas", url: "https://mongodb.com/atlas", icon: Database, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
        { name: "Vercel", url: "https://vercel.com", icon: Cloud, color: "text-slate-900 bg-slate-100 dark:bg-slate-50 border-slate-200" },
        { name: "Render", url: "https://render.com", icon: Cloud, color: "text-cyan-600 bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20" },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8 pb-16">
            <div className="space-y-1">
                <h1 className="page-title">Quick links</h1>
                <p className="text-sm text-slate-500 mt-1">External tools and integrations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map((link, i) => (
                    <motion.a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="group p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:border-indigo-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl border ${link.color} shadow-sm group-hover:scale-105 transition-transform`}>
                                <link.icon className="w-6 h-6" />
                            </div>
                            <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{link.name}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-200 dark:text-zinc-800 group-hover:text-indigo-500 transition-colors" />
                    </motion.a>
                ))}
            </div>
        </div>
    );
}

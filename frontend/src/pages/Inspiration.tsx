import { motion } from "framer-motion";
import { Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Inspiration() {
    const pastProjects = [
        { title: "The Great Green Wall", location: "Africa", impact: "High", year: 2021 },
        { title: "Venice MOSE System", location: "Italy", impact: "Critical", year: 2020 },
        { title: "Delta Works", location: "Netherlands", impact: "Extreme", year: 1997 },
    ];

    return (
        <div className="min-h-screen bg-black p-8 space-y-8">
            <header className="space-y-4">
                <Button asChild variant="ghost" className="p-0 text-white/40 hover:text-white -ml-1">
                    <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                </Button>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Inspiration</h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Past infrastructure resilience projects from around the globe</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pastProjects.map((p, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between h-64"
                    >
                        <div className="space-y-2">
                            <Globe className="w-8 h-8 text-white/20" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{p.title}</h3>
                            <p className="text-xs font-bold text-white/60 tracking-widest uppercase">{p.location} • {p.year}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Resilience Impact</p>
                            <p className="text-xl font-black text-white">{p.impact}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

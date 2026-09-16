import { FileText, ArrowLeft, Building2, Ruler, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function TopProject() {
    return (
        <div className="min-h-screen bg-black p-8 space-y-12">
            <header className="space-y-4">
                <Button asChild variant="ghost" className="p-0 text-white/40 hover:text-white -ml-1">
                    <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                </Button>
                <div className="flex items-center gap-4">
                    <Building2 className="w-12 h-12 text-white" />
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">Top Project: Burj Khalifa</h1>
                </div>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">A Case Study in Modern Engineering and Climate Resilience</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <FileText className="w-6 h-6" /> Documentation
                        </h2>
                        <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                            <p>
                                The Burj Khalifa is not only the world's tallest building but also a marvel of climate-adaptive engineering.
                                Located in a region with extreme heat and high wind loads, its design features a "Y" shaped floor plan to maximize views and stabilize the structure.
                            </p>
                            <p>
                                Its skin is made of reflective glazing with aluminum and textured stainless steel spandrel panels, designed to withstand the extreme temperatures of Dubai's summers.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
                            <Ruler className="w-4 h-4 text-white/40" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Height</p>
                            <p className="text-2xl font-black text-white">828 Meters</p>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
                            <DollarSign className="w-4 h-4 text-white/40" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Cost</p>
                            <p className="text-2xl font-black text-white">$1.5 Billion</p>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
                            <MapPin className="w-4 h-4 text-white/40" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Location</p>
                            <p className="text-2xl font-black text-white">Dubai, UAE</p>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
                            <Building2 className="w-4 h-4 text-white/40" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Floors</p>
                            <p className="text-2xl font-black text-white">163</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative rounded-3xl overflow-hidden border border-white/10 group"
                >
                    <img
                        src="https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?auto=format&fit=crop&q=80&w=1000"
                        alt="Burj Khalifa"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-8 left-8">
                        <p className="text-4xl font-black text-white tracking-tighter uppercase italic">The Icon</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

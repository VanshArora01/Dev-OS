import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ShieldAlert, FileText, Download, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MapView from "@/components/MapView";
import { toast } from "sonner";
import { runEvaluation } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function Evaluate() {
    const navigate = useNavigate();
    const { showSubscriptionModal } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [pinnedLocations, setPinnedLocations] = useState<{ lat: number; lng: number }[]>([]);
    const [infraType, setInfraType] = useState("Hospital");
    const [year, setYear] = useState("2050");
    const [budget, setBudget] = useState("5000000");
    const [hazard, setHazard] = useState("flood");
    const [scenario, setScenario] = useState("high");
    const [result, setResult] = useState<any>(null);
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || '';

    const handleMapClick = (coords: { lat: number; lng: number }) => {
        if (pinnedLocations.length < 4) {
            setPinnedLocations([...pinnedLocations, coords]);
        } else {
            toast.info("Area selection complete (4 points). Click reset to start over.");
        }
    };

    const handleEvaluate = async () => {
        if (pinnedLocations.length < 1) {
            toast.error("Please pin at least one location on the map");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Use the first point or average for backend compatibility for now
            const location = pinnedLocations[0];
            const data = await runEvaluation({
                location,
                infraType,
                year: parseInt(year),
                budget: parseInt(budget),
                hazard,
                scenario,
                userEmail,
                clerkId: user?.id
            });

            setResult(data);
            toast.success("Evaluation complete! Redirecting...");
            setTimeout(() => {
                navigate(`/project/${data.projectId || data._id}`);
            }, 1200);
        } catch (err: any) {
            if (err.message?.toLowerCase().includes('limit')) {
                showSubscriptionModal('pro');
                toast.error(err.message);
            } else {
                toast.error(err.message || "Evaluation failed.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-[calc(100vh-4rem)] flex overflow-hidden">
            {/* Map Side */}
            <div className="flex-1 relative">
                <MapView
                    onMapClick={handleMapClick}
                    pinnedLocations={pinnedLocations}
                />

                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <div className="glass-panel-strong p-3">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Area Selection</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${pinnedLocations.length === 4 ? "bg-green-500 shadow-[0_0_10px_green]" : "bg-white/20 animate-pulse"}`} />
                            <span className="text-xs text-white font-bold">{pinnedLocations.length} / 4 Points Selected</span>
                        </div>
                    </div>
                    {pinnedLocations.length > 0 && (
                        <Button
                            onClick={() => setPinnedLocations([])}
                            variant="outline"
                            className="h-auto py-3 bg-black/40 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                            Reset Area
                        </Button>
                    )}
                </div>
            </div>

            {/* Control Panel */}
            <div className="w-[380px] border-l border-white/10 bg-black/40 backdrop-blur-3xl p-6 overflow-y-auto space-y-8 flex flex-col">
                <header className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5" />
                        <h1 className="text-xl font-black tracking-tighter uppercase">AI Simulation</h1>
                    </div>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                        Define project area and run multi-scenario hazard modeling.
                    </p>
                </header>

                <section className="space-y-6 flex-1">
                    {/* Coordinates Display */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-widest">
                            <span>Area Coordinates</span>
                            <MapPin className="w-3 h-3" />
                        </div>
                        <div className="space-y-2">
                            {pinnedLocations.length > 0 ? pinnedLocations.map((loc, i) => (
                                <div key={i} className="flex justify-between text-[10px] font-mono text-white/60">
                                    <span>P{i + 1}:</span>
                                    <span>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-white/20 italic">Click on map to select 4 points...</p>
                            )}
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Infrastructure Type</Label>
                            <Input
                                value={infraType}
                                onChange={(e) => setInfraType(e.target.value)}
                                className="bg-white/5 border-white/10 text-white h-10 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Target Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/90 border-white/20 text-white">
                                        <SelectItem value="2030">2030</SelectItem>
                                        <SelectItem value="2050">2050</SelectItem>
                                        <SelectItem value="2100">2100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Hazard</Label>
                                <Select value={hazard} onValueChange={setHazard}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/90 border-white/20 text-white">
                                        <SelectItem value="flood">🌊 Flood</SelectItem>
                                        <SelectItem value="heat">🔥 Heat</SelectItem>
                                        <SelectItem value="slr">⚓ SLR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Budget (₹ Lakh)</Label>
                            <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="bg-white/5 border-white/10 text-white h-10 font-bold"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleEvaluate}
                        disabled={loading}
                        className="w-full h-12 bg-white text-black hover:bg-white/90 font-black tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Simulation"}
                    </Button>
                </section>

                {/* AI Results Overlay / Footer */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl space-y-6"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Risk Score</p>
                                    <p className="text-4xl font-black text-white tracking-tighter">{(result.riskScore * 100).toFixed(0)}<span className="text-sm opacity-40">/100</span></p>
                                </div>
                                <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">Top Recommendations</p>
                                <ul className="space-y-2">
                                    {result.recommendations.map((rec: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-[11px] text-white/80 leading-snug">
                                            <span className="font-black text-white/40">{i + 1}.</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                asChild
                                className="w-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-all font-bold tracking-widest uppercase text-xs h-10"
                            >
                                <a href={`${import.meta.env.VITE_API_BASE_URL}${result.reportUrl}`} target="_blank" rel="noreferrer">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF Report
                                </a>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fullscreen Loading State */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <div className="text-center space-y-8 max-w-sm">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                                <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-white animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white tracking-widest uppercase">Consulting AI</h2>
                                <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                                    Mapping {hazard} patterns at {pinnedLocations[0]?.lat.toFixed(3)}, {pinnedLocations[0]?.lng.toFixed(3)} through {year}...
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <label className={`block ${className}`}>{children}</label>;
}

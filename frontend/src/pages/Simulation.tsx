import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MapView from "@/components/MapView";
import { checkSimulationStatus, getSimulationResults, runSimulation, getStats } from "@/lib/api";
import { SimulationResult, StatsData } from "@/lib/types";

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function Simulation() {
  const [sliderVal, setSliderVal] = useState([50]);
  const [hazard, setHazard] = useState("Flood");
  const [budget, setBudget] = useState("50000000");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showBefore, setShowBefore] = useState(false);

  const scenarioYear = sliderVal[0] <= 25 ? 2030 : sliderVal[0] <= 75 ? 2050 : 2100;

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { simulation_id } = await runSimulation({
        projectId: "67b5fe89e67d2b0e6ad279f5", // Fallback ID for demo, should be selected from dropdown in real app
        scenarioYear,
        hazardType: hazard,
        budget: Number(budget),
      });

      // Polling
      const poll = setInterval(async () => {
        const { status } = await checkSimulationStatus(simulation_id);
        if (status === 'completed') {
          clearInterval(poll);
          const res = await getSimulationResults(simulation_id);
          setResult(res);
          setRunning(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setRunning(false);
    }
  };


  return (
    <div className="relative h-[calc(100vh-4rem)] flex">
      {/* Map */}
      <div className="flex-1 relative">
        <MapView showHeatmap={!showBefore} />

        {/* Before/After toggle */}
        <div className="absolute top-4 left-4 glass-panel-strong p-3 flex items-center gap-3 z-10">
          <Label className="text-xs text-muted-foreground">Before</Label>
          <Switch checked={!showBefore} onCheckedChange={(v) => setShowBefore(!v)} />
          <Label className="text-xs text-muted-foreground">After</Label>
        </div>
      </div>

      {/* Left control panel */}
      <div className="absolute left-4 top-16 bottom-4 w-72 glass-panel-strong p-5 space-y-5 z-10 overflow-y-auto">
        <h2 className="text-sm font-bold text-white tracking-widest uppercase opacity-80">Scenario Controls</h2>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Projection Year</label>
          <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} className="mt-2" />
          <div className="flex justify-between text-[10px] text-white/20 font-bold">
            <span>2030</span><span>2050</span><span>2100</span>
          </div>
          <p className="text-center stat-number text-white text-2xl font-black tracking-tighter">{scenarioYear}</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Hazard Type</label>
          <Select value={hazard} onValueChange={setHazard}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white">
              <SelectItem value="Flood">🌊 Flood</SelectItem>
              <SelectItem value="Heat">🔥 Heat</SelectItem>
              <SelectItem value="Storm">⛈ Storm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Budget (₹)</label>
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="bg-white/5 border-white/10 text-white stat-number h-10 font-bold"
            placeholder="50000000"
          />
          <p className="text-[10px] text-white/30 font-bold">{formatINR(Number(budget) || 0)}</p>
        </div>

        <Button
          onClick={handleRun}
          disabled={running}
          className="w-full bg-white text-black hover:bg-white/90 transition-all font-black tracking-widest uppercase h-11"
        >
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          <span className="ml-2">{running ? "Simulating..." : "Run Simulation"}</span>
        </Button>
      </div>

      {/* Right results panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-4 top-4 bottom-4 w-80 glass-panel-strong p-5 space-y-6 z-10 overflow-y-auto"
          >
            <h2 className="text-sm font-bold text-white tracking-widest uppercase opacity-80 border-b border-white/10 pb-4">Simulation Results</h2>

            <div className="grid grid-cols-2 gap-4">
              <ResultCard label="Risk Score" value={`${result.overallRiskScore || result.riskScore}/100`} />
              <ResultCard label="ROI" value={`${result.roiPercent}%`} highlight />
              <ResultCard label="Annual Loss" value={formatINR(result.expectedAnnualLoss || 0)} />
              <ResultCard label="Budget" value={formatINR(result.budget || 0)} />
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                AI Recommendations
              </h3>
              <div className="space-y-3">
                {result.recommendations?.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="flex gap-3 text-[11px] text-white/80 leading-relaxed group"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded border border-white/10 flex items-center justify-center text-[9px] font-black text-white/40 group-hover:bg-white group-hover:text-black transition-colors">
                      {i + 1}
                    </div>
                    <span>{rec}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running overlay */}
      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-white/10 rounded-full animate-ping" />
                <Loader2 className="absolute inset-0 w-16 h-16 text-white animate-spin stroke-[1]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl text-white font-black tracking-widest uppercase">Initializing Simulation</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Analyzing {hazard} risk for {scenarioYear}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 space-y-2 border border-white/10 ${highlight ? 'bg-white/10' : 'bg-white/5'} rounded-lg backdrop-blur-sm group hover:border-white/40 transition-all duration-300`}>
      <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">{label}</p>
      <p className={`stat-number text-xl ${highlight ? "text-white neon-text" : "text-white/90"} font-black tracking-tighter`}>{value}</p>
    </div>
  );
}


import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  IndianRupee,
  BarChart3,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building2,
  Tornado
} from "lucide-react";
import { calculateROI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Helper for counting numbers animation
const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

export default function ROICalculator() {
  const [formData, setFormData] = useState({
    budget: 50000000,
    riskScore: 65,
    hazard: 'Flood',
    infraType: 'Hospital',
    lifespanYears: 20
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateROI(formData);
      setResults(res);
    } catch (error) {
      console.error(error);
      toast.error("Failed to run economic simulation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen bg-[#020202]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Standard Economic Engine v4.2</h2>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
            <Calculator className="w-12 h-12 text-blue-500" />
            Deterministic ROI Playground
          </h1>
          <p className="text-sm text-white/30 font-bold uppercase tracking-widest">
            Calculate resilience ROI using grounded climate-economic multipliers
          </p>
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-2 px-6 rounded-full flex items-center gap-3 font-black italic tracking-widest text-[10px]">
          <Zap className="w-4 h-4 animate-pulse" />
          ISIMIP 3B GROUNDED
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Parametric Inputs */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl rounded-[40px] border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent opacity-50" />
            <CardContent className="p-10 space-y-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                    <IndianRupee className="w-3 h-3 text-blue-500" /> Total Project Budget
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-xl font-black text-white outline-none focus:border-blue-500/40 transition-all group-hover:bg-white/[0.05]"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase italic">INR</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                      <ShieldAlert className="w-3 h-3 text-red-500" /> Baseline Risk Score
                    </label>
                    <span className="text-xl font-black text-blue-500 italic">{formData.riskScore}%</span>
                  </div>
                  <Slider
                    value={[formData.riskScore]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setFormData({ ...formData, riskScore: val[0] })}
                    className="py-4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 italic">
                      <Tornado className="w-3 h-3 text-orange-500" /> Hazard
                    </label>
                    <select
                      value={formData.hazard}
                      onChange={(e) => setFormData({ ...formData, hazard: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none appearance-none hover:bg-white/[0.05] transition-all"
                    >
                      {['Flood', 'Heat', 'SLR'].map(h => <option key={h} value={h} className="bg-black">{h.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 italic">
                      <Building2 className="w-3 h-3 text-purple-500" /> Infra Type
                    </label>
                    <select
                      value={formData.infraType}
                      onChange={(e) => setFormData({ ...formData, infraType: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none appearance-none hover:bg-white/[0.05] transition-all"
                    >
                      {['Hospital', 'Bridge', 'Road', 'School'].map(i => <option key={i} value={i} className="bg-black">{i.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                    <Clock className="w-3 h-3 text-green-500" /> Asset Lifespan
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 20, 30].map(yr => (
                      <button
                        key={yr}
                        onClick={() => setFormData({ ...formData, lifespanYears: yr })}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all border ${formData.lifespanYears === yr ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 border-white/5 text-white/40'}`}
                      >
                        {yr} YEARS
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-blue-500/20 italic group"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Running Engine...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Calculate Economic ROI
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Results View */}
        <div className="lg:col-span-8 space-y-10">
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[50px] space-y-6">
              <div className="p-6 rounded-full bg-white/5">
                <ShieldCheck className="w-12 h-12 text-white/10" />
              </div>
              <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs">Awaiting Economic Parameters</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Primary ROI Metric */}
                <Card className="md:col-span-2 bg-white/[0.01] border-white/5 rounded-[40px] p-12 relative overflow-hidden group hover:border-white/20 transition-all">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <BarChart3 className="w-40 h-40 text-white" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic text-center md:text-left">Project ROI Multiple</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8 pt-4">
                      <div className="text-9xl font-black text-white italic tracking-tighter group-hover:scale-105 transition-transform duration-700">
                        <AnimatedNumber value={results.roiMultiple} decimals={2} />
                        <span className="text-3xl text-blue-500 ml-2">x</span>
                      </div>
                      <div className="space-y-3">
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 py-2 px-6 rounded-full font-black italic tracking-widest text-[10px]">
                          VIABLE INVESTMENT
                        </Badge>
                        <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
                          Forecasted savings per ₹1 invested in resilience.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Payback Card */}
                <Card className="bg-blue-600 border-none rounded-[40px] p-12 flex flex-col justify-between group overflow-hidden relative shadow-2xl shadow-blue-500/20">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <Clock className="w-64 h-64 text-white" />
                  </div>
                  <h3 className="text-[10px] font-black text-black/40 uppercase tracking-[0.4em] italic relative z-10">Payback Period</h3>
                  <div className="space-y-2 relative z-10 pt-6">
                    <div className="text-7xl font-black text-white italic tracking-tighter">
                      <AnimatedNumber value={results.paybackYears} decimals={1} />
                      <span className="text-xl text-black/40 ml-2 font-black uppercase">yrs</span>
                    </div>
                    <p className="text-[10px] text-black/50 font-black uppercase tracking-widest italic">Break-even Horizon</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <MetricBox
                  title="Annual Loss (EAL)"
                  value={results.annualLoss}
                  prefix="₹"
                  icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
                  desc="Projected climate loss"
                />
                <MetricBox
                  title="Total Exposure"
                  value={results.totalExposure}
                  prefix="₹"
                  icon={<BarChart3 className="w-4 h-4 text-orange-500" />}
                  desc={`${results.lifespanYears}yr risk horizon`}
                />
                <MetricBox
                  title="Expected Savings"
                  value={results.expectedSavings}
                  prefix="₹"
                  icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                  desc="Loss avoided via CAPEX"
                  isPositive
                />
              </div>

              {/* Engine Logic Footer */}
              <div className="p-10 rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center gap-10">
                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/10 shrink-0">
                  <Info className="w-8 h-8 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white italic tracking-tight uppercase">Deterministic Economic Modeling</h4>
                  <p className="text-[11px] text-white/30 font-medium leading-relaxed italic">
                    This model excludes human bias and AI hallucinations. Calculations are derived from:
                    <br /><span className="text-white font-bold opacity-60">Annual Loss = Risk Score × Budget × Hazard Multiplier</span>
                    <br /><span className="text-white font-bold opacity-60">Mitigation Cost = Budget × Infrastructure Exposure Percentage</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, prefix = "", suffix = "", icon, desc, isPositive }: any) {
  return (
    <div className="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.01] space-y-6 group hover:border-white/20 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic">{title}</h4>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">{icon}</div>
      </div>
      <div className="space-y-1">
        <div className={`text-3xl font-black tracking-tight italic ${isPositive ? 'text-green-500' : 'text-white'}`}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={0} />
        </div>
        <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest">{desc}</p>
      </div>
    </div>
  );
}

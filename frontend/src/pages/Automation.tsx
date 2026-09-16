import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Bell, Clock, ShieldAlert, Play, Plus } from "lucide-react";
import { getProjects } from "@/lib/api";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Automation() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
            Climate Automation
          </h1>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">Scheduled risk detection & alerting systems</p>
        </div>
        <Button className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs h-12 px-6 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Create Automation
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-white/30 uppercase tracking-[0.2em] mb-4">Active Triggers</h2>
          {loading ? (
            <div className="h-32 bg-white/5 animate-pulse rounded-2xl" />
          ) : (
            projects.map((p, idx) => (
              <AutomationRow key={p.id || p._id} project={p} index={idx} />
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel-strong p-6 space-y-6 rounded-3xl border-white/5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Global Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Email Alerts</p>
                  <p className="text-[10px] text-white/40">Notify on risk score surge &gt; 80</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Daily Recalculation</p>
                  <p className="text-[10px] text-white/40">Sync with latest IMD data</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Public API Webhooks</p>
                  <p className="text-[10px] text-white/40">Push results to external GIS</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldAlert className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">System Health</p>
            </div>
            <p className="text-sm text-white/80 font-medium">All 24 automation workers are online. Next global sync in 4h 12m.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationRow({ project, index }: { project: Project; index: number }) {
  const [active, setActive] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${active ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 grayscale'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${active ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/20'}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{project.name || project.title} Monitoring</h4>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-[8px] border-white/10 font-bold uppercase tracking-widest py-0">Daily Scan</Badge>
            <p className="text-[10px] text-white/30 font-bold uppercase">Next: Feb 21, 04:00 AM</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-bold text-white/20 uppercase">Last Result</p>
          <p className="text-[11px] font-black text-white italic">NO CHANGE</p>
        </div>
        <Switch checked={active} onCheckedChange={(val) => {
          setActive(val);
          toast.info(`${project.title} automation ${val ? 'resumed' : 'paused'}`);
        }} />
      </div>
    </motion.div>
  );
}

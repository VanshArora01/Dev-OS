import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeSession } from "../lib/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { 
  Bot, Clock, Save, X, AlertCircle, CheckCircle2, ChevronRight, Activity, Zap, 
  Terminal, Sparkles, Layout, ClipboardList, Target, BrainCircuit
} from "lucide-react";
import { Button } from "./ui/button";

// Extend window for Puter
declare global {
    interface Window {
        puter: any;
    }
}

interface SessionReviewModalProps {
  projectId: string;
  projectContext: {
    name: string;
    type: string;
    description: string;
    lastNextStep: string;
  };
  onSave: (sessionData: any) => void;
  onClose: () => void;
}

export default function SessionReviewModal({
  projectId, projectContext, onSave, onClose
}: SessionReviewModalProps) {
  const { userId: clerkId } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    summary: "",
    problems: "",
    decisions: "",
    nextStep: "",
    durationMinutes: 1
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem("pendingSession");
    if (pending) {
      const { images, duration } = JSON.parse(pending);
      // Remove only after we've read it (or maybe keep it in state)
      runAnalysis(images, duration);
    } else {
      setLoading(false);
    }
  }, []);

  const runAnalysis = async (images: any[], duration: number) => {
    try {
      setLoading(true);
      setError(null);
      
      let finalAnalysis: any = null;
      let provider: string = "puter-openai";

      console.log("[SessionReview] Initiating Puter.js Global Neural Analysis (GPT-4o-mini)...");
      
      try {
        // Ensure Puter is loaded
        if (!window.puter) {
             const script = document.createElement('script');
             script.src = "https://js.puter.com/v2/";
             document.head.appendChild(script);
             await new Promise((resolve) => script.onload = resolve);
        }

        const prompt = `You are the DevOS Intelligence System. Analyze the provided developer screenshot(s).
        CONTEXT: Session lasted ${duration} minutes. Project: ${projectContext.name}.
        
        TASK: Extract technical accomplishments and upcoming logic.
        Respond with ONLY these JSON keys:
        - summary: Concrete technical summary (2-3 sentences)
        - problemsFaced: Errors or bugs seen (if any)
        - decisionsMade: Tech choices or refactors
        - nextStep: Logical next task
        - toolsUsed: Array of tools used
        - minutesEstimate: ${duration}`;

        // Attempt GPT-4o-mini Vision via Puter (Extremely stable/reliable)
        const puterResponse = await window.puter.ai.chat([
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { 
                        type: 'image_url', 
                        image_url: { url: images[0].base64.startsWith('data:') ? images[0].base64 : `data:image/png;base64,${images[0].base64}` } 
                    }
                ]
            }
        ], { 
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" }
        });

        const text = typeof puterResponse === 'string' ? puterResponse : puterResponse.toString();
        const clean = text.match(/\{[\s\S]*\}/)?.[0] || text;
        finalAnalysis = JSON.parse(clean);
        provider = "puter-gpt4o";
        localStorage.removeItem("pendingSession");

      } catch (puterErr) {
        console.warn("[SessionReview] Puter Neural Link failed, falling back to Backend Brain:", puterErr);
        
        const result = await analyzeSession({ images, duration, projectContext });
        finalAnalysis = result.analysis;
        provider = result.provider;
        localStorage.removeItem("pendingSession");
      }

      setAnalysis({ ...finalAnalysis, provider });
      setForm({
        summary: finalAnalysis.summary || "",
        problems: finalAnalysis.problemsFaced || "",
        decisions: finalAnalysis.decisionsMade || "",
        nextStep: finalAnalysis.nextStep || "",
        durationMinutes: finalAnalysis.minutesEstimate || duration || 1
      });
    } catch (err: any) {
      console.error("[SessionReview] All Intelligence layers failed:", err);
      setError("Intelligence systems offline. Manual entry required.");
      setForm(prev => ({ ...prev, durationMinutes: duration || 1 }));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!form.summary.trim() || !form.nextStep.trim()) {
      setError("Summary and next step are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, clerkId: clerkId || user?.id });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save session. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-zinc-950 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
        >
          {/* Subtle Glow Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00FF87]/5 blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-zinc-950/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ClipboardList size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Review Post-Session.</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center gap-2">
                  {loading ? (
                    <><Activity size={10} className="animate-pulse" /> Finalizing Telemetry...</>
                  ) : (
                    <><CheckCircle2 size={10} className="text-[#00FF87]" /> Session Context Captured</>
                  )}
                </p>
              </div>
            </div>
            {!loading && (
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-20 text-center space-y-8 relative z-10">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-500">
                  <Bot size={24} className="animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-white tracking-tight">AI Decoder Active.</p>
                <p className="text-xs font-black uppercase tracking-widest text-white/30 italic">Synthesizing screenshot vectors into work telemetry...</p>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-rose-500">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {analysis && (
                <div className="p-4 rounded-2xl bg-[#00FF87]/5 border border-[#00FF87]/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00FF87]/60">
                  <Sparkles size={14} /> AI synchronized {analysis.toolsUsed?.length || 0} tool interactions.
                </div>
              )}

              {/* Input Fields */}
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Accomplishment Vector</label>
                  <textarea
                    value={form.summary}
                    onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/5 rounded-3xl p-5 text-xs font-bold text-zinc-300 leading-relaxed focus:border-indigo-500/50 transition-all outline-none min-h-[80px] placeholder:text-white/5 placeholder:italic"
                    placeholder="Describe the primary work accomplished..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Friction Points</label>
                    <input
                      value={form.problems}
                      onChange={e => setForm(f => ({ ...f, problems: e.target.value }))}
                      className="w-full h-12 bg-zinc-900 border border-white/5 rounded-2xl px-5 text-xs font-bold text-zinc-300 focus:border-rose-500/30 transition-all outline-none placeholder:text-white/5"
                      placeholder="Any blockers?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Decentralized Decisions</label>
                    <input
                      value={form.decisions}
                      onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))}
                      className="w-full h-12 bg-zinc-900 border border-white/5 rounded-2xl px-5 text-xs font-bold text-zinc-300 focus:border-indigo-500/30 transition-all outline-none placeholder:text-white/5"
                      placeholder="Technical moves?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#00FF87] bg-[#00FF87]/10 px-2 py-0.5 rounded ml-2">Next Immediate Target</label>
                  <div className="relative">
                    <Target size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" />
                    <input
                      value={form.nextStep}
                      onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
                      className="w-full h-12 bg-zinc-900 border border-[#00FF87]/10 rounded-2xl pl-14 pr-6 text-xs font-black text-white focus:border-[#00FF87]/40 transition-all outline-none italic placeholder:text-white/5"
                      placeholder="First move of the next session..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-1 w-full">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Session Intensity</label>
                    <div className="flex items-center gap-4 bg-zinc-900 p-2.5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center">
                            <Clock size={12} className="text-indigo-400" />
                         </div>
                         <input 
                            type="number"
                            value={form.durationMinutes}
                            onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                            className="w-16 bg-transparent border-none text-xs font-black text-white focus:outline-none"
                         />
                         <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">MIN</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="300"
                        value={form.durationMinutes}
                        onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                        className="flex-1 accent-indigo-500 h-1.5 rounded-full overflow-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && (
            <div className="p-8 bg-zinc-900/50 border-t border-white/5 flex gap-4 items-center relative z-10">
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5"
              >
                Discard Context
              </Button>
              <Button
                disabled={saving}
                onClick={handleManualSave}
                className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {saving ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Finalize Records →
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

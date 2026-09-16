import { Search, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

interface ProjectDecisionsTabProps {
  project: Project;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  newDecision: { title: string; reasoning: string; tag: string };
  setNewDecision: (value: { title: string; reasoning: string; tag: string }) => void;
  handleAddDecision: () => void;
  handleUpdateProjectFlat: (update: Partial<Project>, options?: { silent?: boolean }) => void;
}

const TAG_DOT: Record<string, string> = {
  Technical: "bg-sky-500",
  Architecture: "bg-violet-500",
  Client: "bg-amber-500",
  Design: "bg-rose-500",
};

const TAG_CHIP: Record<string, string> = {
  Technical: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
  Architecture: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
  Client: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  Design: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

const TAGS = ["Technical", "Architecture", "Client", "Design"] as const;

export function ProjectDecisionsTab({
  project,
  searchTerm,
  setSearchTerm,
  newDecision,
  setNewDecision,
  handleAddDecision,
  handleUpdateProjectFlat,
}: ProjectDecisionsTabProps) {
  const [justLogged, setJustLogged] = useState(false);
  const [pulseLine, setPulseLine] = useState(false);

  const entries = (project.decisions || [])
    .filter(
      (d) =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onLog = () => {
    if (!newDecision.title) return;
    handleAddDecision();
    setJustLogged(true);
    setPulseLine(true);
    window.setTimeout(() => setJustLogged(false), 900);
    window.setTimeout(() => setPulseLine(false), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">Decision log</h2>
          <p className="text-xs text-slate-400 mt-0.5">{project.decisions?.length || 0} locked in</p>
        </div>
        <div className="relative w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full h-10 bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-full pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        <motion.div
          animate={justLogged ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.45 }}
          className="col-span-12 xl:col-span-4 self-start sticky top-4"
        >
          <div className="rounded-3xl border border-brand/20 bg-white/80 dark:bg-[#16122a]/90 backdrop-blur-xl p-5 flex flex-col gap-3 shadow-glow max-h-[min(520px,70vh)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Log a call</p>
              {justLogged && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Check size={12} /> Saved
                </span>
              )}
            </div>
            <input
              value={newDecision.title}
              onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-white/10 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/25"
              placeholder="What was decided?"
            />
            <textarea
              value={newDecision.reasoning}
              onChange={(e) => setNewDecision({ ...newDecision, reasoning: e.target.value })}
              className="w-full min-h-[96px] max-h-[140px] overflow-y-auto bg-slate-50 dark:bg-white/10 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/25 resize-none"
              placeholder="Why, if known"
            />
            <div className="relative flex flex-wrap gap-1 p-1 rounded-full bg-slate-100 dark:bg-white/10">
              {TAGS.map((tag) => {
                const selected = newDecision.tag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewDecision({ ...newDecision, tag })}
                    className={cn(
                      "relative h-8 px-3 rounded-full text-xs font-semibold z-10",
                      selected ? "text-white" : "text-slate-500 dark:text-zinc-400"
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="decision-tag-pill"
                        className="absolute inset-0 rounded-full bg-brand shadow-glow"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{tag}</span>
                  </button>
                );
              })}
            </div>
            <Button onClick={onLog} disabled={!newDecision.title} className="btn-primary mt-1 active:scale-[0.98]">
              Log decision
            </Button>
          </div>
        </motion.div>

        <div className="col-span-12 xl:col-span-8 relative pl-6">
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-brand/50 via-slate-200 to-transparent dark:via-white/10 overflow-hidden">
            {pulseLine && (
              <motion.span
                initial={{ top: 0, opacity: 1 }}
                animate={{ top: "100%", opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-1/2 -translate-x-1/2 w-2 h-8 rounded-full bg-brand blur-[2px]"
                style={{ position: "absolute" }}
              />
            )}
          </div>
          {entries.length === 0 ? (
            <BentoCard className="py-16 text-center text-sm text-slate-400">No decisions logged.</BentoCard>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {entries.map((d, i) => (
                  <motion.div
                    key={d._id || `${d.title}-${d.date}`}
                    initial={{ opacity: 0, y: -18, scale: 0.97 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      boxShadow: i === 0 && justLogged ? "0 0 0 2px rgba(108,92,231,0.45)" : "0 0 0 0 transparent",
                    }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-3xl"
                  >
                    <span
                      className={cn(
                        "absolute -left-6 top-8 h-3 w-3 rounded-full ring-4 ring-background z-10",
                        TAG_DOT[d.tag] || "bg-brand"
                      )}
                    />
                    <BentoCard className="flex flex-col gap-2 !py-4" hoverLift={false}>
                      {/* Strict stacked rows — no absolute overlap */}
                      <div className="flex items-center justify-between gap-3 min-h-[28px]">
                        <span
                          className={cn(
                            "inline-flex h-7 items-center px-2.5 rounded-full text-[11px] font-bold shrink-0",
                            TAG_CHIP[d.tag] || TAG_CHIP.Technical
                          )}
                        >
                          {d.tag}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const original = project.decisions || [];
                            const idx = original.findIndex((x) => x === d || (x._id && x._id === d._id));
                            const updated = original.filter((_, di) => di !== (idx === -1 ? i : idx));
                            handleUpdateProjectFlat({ decisions: updated });
                          }}
                          className="text-slate-300 hover:text-rose-500 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h3 className="font-heading text-base font-bold leading-snug break-words">{d.title}</h3>
                      {d.reasoning ? (
                        <p className="text-sm text-slate-500 leading-relaxed break-words">{d.reasoning}</p>
                      ) : null}
                      <p className="text-[11px] text-slate-400 pt-1">{format(new Date(d.date), "MMM d, yyyy")}</p>
                    </BentoCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Plus, Sparkles, AlertTriangle, ArrowRight, Clock, Zap } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Project, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { truncateText, motionEase } from "@/lib/motion";

interface ProjectSessionsTabProps {
  project: Project;
  sessions: Session[];
  setLogForm: (form: {
    summary: string;
    problems: string;
    decisions: string;
    nextStep: string;
    durationMinutes: number;
  }) => void;
  setShowSessionReview: (open: boolean) => void;
}

function durationLabel(minutes?: number) {
  const m = minutes || 0;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m} min`;
}

function isBlocked(problems?: string) {
  const p = (problems || "").trim().toLowerCase();
  if (!p) return false;
  return !["none", "n/a", "na", "no", "-", "no friction", "no frictions", "no blockers", "none."].includes(p);
}

function intensity(minutes?: number) {
  const m = Math.min(Math.max(minutes || 0, 0), 180);
  return 0.35 + (m / 180) * 0.65;
}

export function ProjectSessionsTab({
  project,
  sessions,
  setLogForm,
  setShowSessionReview,
}: ProjectSessionsTabProps) {
  const [openId, setOpenId] = useState<string | null>(sessions[0]?._id || null);
  const chronological = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [sessions]
  );
  const newestFirst = useMemo(() => [...chronological].reverse(), [chronological]);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const openLog = () => {
    setLogForm({
      summary: "",
      problems: "",
      decisions: "",
      nextStep: project?.nextPlannedStep || "",
      durationMinutes: 30,
    });
    setShowSessionReview(true);
  };

  return (
    <div className="relative space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Session trace</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Timeline</h2>
          <p className="text-sm text-slate-500 mt-1">
            {sessions.length} pulses · {durationLabel(totalMinutes)} in the log
          </p>
        </div>
        <Button onClick={openLog} className="btn-primary h-10">
          <Plus size={14} className="mr-1.5" />
          Log session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <button
          type="button"
          onClick={openLog}
          className="relative w-full overflow-hidden rounded-[2rem] border border-dashed border-brand/30 bg-gradient-to-br from-brand/10 via-transparent to-fuchsia-500/10 px-8 py-20 text-center"
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(108,92,231,0.25),transparent_55%)]" />
          <Sparkles className="mx-auto text-brand mb-3" size={22} />
          <p className="font-heading text-xl font-bold relative">No pulses yet</p>
          <p className="text-sm text-slate-500 mt-2 relative">Log the first session and watch the trace light up.</p>
        </button>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute left-[1.15rem] sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-brand via-fuchsia-500/70 to-sky-400/40"
              initial={{ scaleY: 0, originY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.1, ease: motionEase }}
            />
            <motion.span
              className="absolute left-1/2 h-24 w-1.5 -translate-x-1/2 rounded-full bg-white/80 blur-[2px]"
              animate={{ top: ["-20%", "110%"] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="space-y-8 sm:space-y-10">
            {newestFirst.map((session, index) => {
              const blocked = isBlocked(session.problems);
              const left = index % 2 === 0;
              const open = openId === session._id;
              const glow = intensity(session.durationMinutes);

              return (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: index * 0.07, duration: 0.55, ease: motionEase }}
                  className={cn(
                    "relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10 pl-12 sm:pl-0",
                    left ? "" : ""
                  )}
                >
                  <div className={cn("sm:col-start-1", !left && "sm:col-start-2")}>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : session._id)}
                      className="group relative w-full text-left"
                    >
                      <span
                        className="absolute z-10 top-7 -left-[2.4rem] sm:hidden h-4 w-4 rounded-full border-2 border-white dark:border-[#0b0b12]"
                        style={{
                          background: blocked
                            ? "radial-gradient(circle, #fb7185, #e11d48)"
                            : "radial-gradient(circle, #c4b5fd, #6c5ce7)",
                          boxShadow: blocked
                            ? "0 0 18px rgba(244,63,94,0.65)"
                            : `0 0 ${18 * glow}px rgba(108,92,231,${0.35 + glow * 0.4})`,
                        }}
                      />
                      <span
                        className={cn(
                          "hidden sm:block absolute top-8 h-4 w-4 rounded-full border-2 border-white dark:border-[#0b0b12] z-10",
                          left ? "-right-[1.6rem]" : "-left-[1.6rem]"
                        )}
                        style={{
                          background: blocked
                            ? "radial-gradient(circle, #fb7185, #e11d48)"
                            : "radial-gradient(circle, #c4b5fd, #6c5ce7)",
                          boxShadow: blocked
                            ? "0 0 22px rgba(244,63,94,0.7)"
                            : `0 0 ${22 * glow}px rgba(108,92,231,${0.4 + glow * 0.4})`,
                        }}
                      />

                      <motion.div
                        whileHover={{ y: -4, rotateX: 2 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className={cn(
                          "relative overflow-hidden rounded-[1.75rem] border p-5 backdrop-blur-xl",
                          blocked
                            ? "border-rose-500/25 bg-rose-500/[0.07]"
                            : "border-white/10 bg-white/[0.04] dark:bg-[#14141f]/80",
                          open && "shadow-[0_20px_60px_-24px_rgba(108,92,231,0.65)] border-brand/40"
                        )}
                      >
                        <div
                          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl"
                          style={{
                            background: blocked
                              ? "rgba(244,63,94,0.25)"
                              : `rgba(108,92,231,${0.18 + glow * 0.2})`,
                          }}
                        />
                        <div className="relative flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {format(new Date(session.createdAt), "MMM d · h:mm a")}
                          </p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              blocked
                                ? "bg-rose-500/15 text-rose-400"
                                : "bg-brand/15 text-brand"
                            )}
                          >
                            {blocked ? <AlertTriangle size={10} /> : <Zap size={10} />}
                            {blocked ? "Friction" : durationLabel(session.durationMinutes)}
                          </span>
                        </div>
                        <h3 className="relative font-heading text-lg font-bold mt-3 leading-snug text-slate-900 dark:text-white">
                          {truncateText(session.summary, open ? 280 : 110) || "Untitled pulse"}
                        </h3>
                        <p className="relative text-[11px] text-slate-500 mt-2">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </p>

                        <AnimatePresence>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: motionEase }}
                              className="relative overflow-hidden"
                            >
                              <div className="pt-4 space-y-3">
                                {session.decisions && (
                                  <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                                      Decisions
                                    </span>
                                    {session.decisions}
                                  </p>
                                )}
                                {blocked && (
                                  <p className="text-sm text-rose-400 leading-relaxed">{session.problems}</p>
                                )}
                                {session.nextStep && (
                                  <div className="flex items-start gap-2 rounded-2xl bg-brand/10 px-3 py-2.5">
                                    <ArrowRight size={14} className="text-brand mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                                      {session.nextStep}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <Clock size={12} />
                                  {durationLabel(session.durationMinutes)} deep work
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

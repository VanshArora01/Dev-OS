import { Check, ExternalLink, Figma, Github, Globe, Play, Pause, Timer, CalendarClock, Flag, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { BentoCard } from "@/components/ui/bento-card";
import { IconChip } from "@/components/ui/icon-chip";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusPill } from "@/components/ui/status-pill";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, Session, ProjectSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectOverviewTabProps {
  project: Project;
  sessions: Session[];
  summary: ProjectSummary | null;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  timerSeconds?: number;
  setActiveTab: (tab: string) => void;
  toggleDeliverable: (idx: number) => void;
  daysUntilDeadline: number | null;
  milestonesDone: number;
  totalMilestones: number;
}

function formatClock(total: number) {
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function CheckMark({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
        done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"
      )}
    >
      {done && (
        <motion.svg
          viewBox="0 0 16 16"
          className="w-3 h-3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.path
            d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35 }}
          />
        </motion.svg>
      )}
      {!done && <Check size={10} className="opacity-0" />}
    </span>
  );
}

export function ProjectOverviewTab({
  project,
  sessions,
  summary,
  isTimerRunning,
  startTimer,
  stopTimer,
  timerSeconds = 0,
  setActiveTab,
  toggleDeliverable,
  daysUntilDeadline,
  milestonesDone,
  totalMilestones,
}: ProjectOverviewTabProps) {
  const completion = Math.round((milestonesDone / (totalMilestones || 1)) * 100);
  const focusHours = Math.floor((project?.totalMinutesWorked || 0) / 60);
  const health = summary?.healthStatus;
  const mission = sessions[0]?.nextStep || project.nextPlannedStep || "No next step logged yet.";
  const checklist = project.requirements?.deliverablesChecklist || [];
  const vault = [
    { label: "Repository", icon: Github, val: project.repoUrl, accent: "violet" as const },
    { label: "Documentation", icon: Globe, val: project.docsUrl, accent: "sky" as const },
    { label: "Figma", icon: Figma, val: project.reference?.figmaLinks?.[0], accent: "coral" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="bento-grid">
        <StatCard icon={Timer} accent="violet" label="Sessions" value={sessions.length} hint="This project" />
        <StatCard
          icon={CalendarClock}
          accent={daysUntilDeadline !== null && daysUntilDeadline < 7 ? "coral" : "amber"}
          label="Deadline"
          value={daysUntilDeadline !== null ? `${daysUntilDeadline}d` : "—"}
          hint={daysUntilDeadline !== null && daysUntilDeadline < 7 ? "Needs attention" : "Time remaining"}
        />
        <StatCard
          icon={Flag}
          accent="emerald"
          label="Milestones"
          value={`${milestonesDone}/${totalMilestones || 0}`}
          hint="Completed vs total"
        />
        <StatCard
          variant="filled"
          icon={HeartPulse}
          accent="violet"
          label="Health"
          value={health || "—"}
          hint={`${focusHours}h focus logged`}
        />
      </div>

      <div className="bento-grid">
        <BentoCard span="col-span-12 xl:col-span-7" className="min-h-[300px] flex flex-col relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <p className="eyebrow mb-2 relative z-10">Current mission</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight leading-snug flex-1 relative z-10">
            {mission}
          </h2>
          {project.description && (
            <p className="text-sm text-slate-500 mt-3 line-clamp-3 relative z-10">{project.description}</p>
          )}
          <div className="mt-5 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Mission progress</span>
              <span className="text-xs font-bold text-brand tabular-nums">{completion}%</span>
            </div>
            <ProgressBar value={completion} accent="violet" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6 relative z-10">
            <motion.div whileTap={{ scale: 0.96 }}>
              {!isTimerRunning ? (
                <Button onClick={startTimer} className="btn-primary gap-2">
                  <Play size={14} fill="currentColor" />
                  Start session
                </Button>
              ) : (
                <Button
                  onClick={stopTimer}
                  className="h-10 px-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold gap-2"
                >
                  <Pause size={14} fill="currentColor" />
                  Pause session
                </Button>
              )}
            </motion.div>
            {health && (
              <StatusPill
                kind={health === "slipping" ? "paused" : health === "inactive" ? "pending" : "active"}
                value={health}
              />
            )}
            {(project.techStack || []).slice(0, 4).map((t) => (
              <StatusPill key={t} kind="personal" value={t} />
            ))}
          </div>
        </BentoCard>

        <BentoCard
          variant="spotlight"
          span="col-span-12 xl:col-span-5"
          className="flex items-center justify-between gap-4 min-h-[300px] relative overflow-hidden"
        >
          {isTimerRunning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-brand/30 to-transparent"
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white/60">Live tracker</p>
            <p className="font-heading text-4xl font-bold tabular-nums mt-3">{formatClock(timerSeconds)}</p>
            <p className="text-sm text-white/50 mt-2">{isTimerRunning ? "Recording focus" : "Idle — hit start"}</p>
          </div>
          <ProgressRing
            value={isTimerRunning ? Math.min(100, completion + (timerSeconds % 60) / 60) : completion}
            inverted
            label="Done"
            size={140}
          />
        </BentoCard>
      </div>

      <div className="bento-grid">
        <BentoCard span="col-span-12 lg:col-span-5">
          <p className="font-heading text-base font-bold mb-4">Vault</p>
          <div className="grid grid-cols-1 gap-2">
            {vault.map((link) => {
              const inner = (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] px-3 py-3 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                  <IconChip icon={link.icon} accent={link.accent} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{link.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{link.val || "Not linked yet"}</p>
                  </div>
                  {link.val && <ExternalLink size={14} className="text-slate-300" />}
                </div>
              );
              return link.val ? (
                <a key={link.label} href={link.val} target="_blank" rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={link.label}>{inner}</div>
              );
            })}
          </div>
        </BentoCard>

        <BentoCard span="col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-base font-bold">Deliverables</p>
            <button type="button" onClick={() => setActiveTab("brief")} className="text-sm font-medium text-brand">
              Open brief
            </button>
          </div>
          <ProgressBar
            value={checklist.length ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100) : 0}
            accent="emerald"
            className="mb-4"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklist.slice(0, 8).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDeliverable(idx)}
                className="flex items-start gap-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] px-3 py-3 text-left hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-[0.99] transition-all"
              >
                <CheckMark done={!!item.done} />
                <span
                  className={cn(
                    "text-sm leading-snug relative transition-colors duration-300",
                    item.done ? "text-slate-400" : "text-slate-700 dark:text-zinc-200"
                  )}
                >
                  {item.item}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-[1.5px] bg-slate-400 origin-left transition-transform duration-300",
                      item.done ? "w-full scale-x-100" : "w-full scale-x-0"
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
          {checklist.length === 0 &&
            (project.deliverables || []).slice(0, 8).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5">
                <CheckMark done={false} />
                <span className="text-sm">{item}</span>
              </div>
            ))}
        </BentoCard>
      </div>
    </div>
  );
}

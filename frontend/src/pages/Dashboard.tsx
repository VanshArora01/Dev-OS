import { useUser } from "@clerk/clerk-react";
import { Plus, ArrowRight, FolderKanban, PlayCircle, CalendarClock, Timer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectsGrid from "@/components/ProjectsGrid";
import { useState, useEffect, useMemo } from "react";
import ProjectCreationModal from "@/components/ProjectCreationModal";
import { getDashboardSummary } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { useNavigate, Link } from "react-router-dom";
import { StatCard } from "@/components/ui/stat-card";
import { BentoCard } from "@/components/ui/bento-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusPill } from "@/components/ui/status-pill";
import { MiniBarRow } from "@/components/ui/mini-bar-row";
import { Sparkline } from "@/components/ui/sparkline";
import { truncateText, staggerContainer, staggerItem } from "@/lib/motion";
import { format, subDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useOnboarding } from "@/context/OnboardingContext";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { triggerFirstProjectTour } = useOnboarding();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getDashboardSummary(user.id)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: any) => {
        if (!cancelled) setLoadError(err.message || "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const lastSession = summary?.recentSessions?.[0];
  const resumeProject = summary?.lastProject;
  const resumeSummary = truncateText(
    lastSession?.summary || summary?.yesterdaySummary || resumeProject?.lastSessionSummary,
    200
  );
  const resumeTime = lastSession?.createdAt || resumeProject?.lastWorkedAt;
  const resumeDuration = lastSession?.durationMinutes;
  const activeCount = summary?.activeProjects ?? 0;
  const totalCount = summary?.totalProjects ?? 0;
  const healthPct = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;

  const weekBars = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    const sessions = summary?.recentSessions || [];
    return {
      values: days.map((day) => sessions.filter((s) => s.createdAt && isSameDay(new Date(s.createdAt), day)).length),
      labels: days.map((day) => format(day, "EEE")),
      details: days.map((day) =>
        sessions
          .filter((s) => s.createdAt && isSameDay(new Date(s.createdAt), day))
          .map((s) => truncateText(s.summary || s.projectName || "Session", 48))
      ),
    };
  }, [summary]);

  const sparklines = useMemo(() => {
    const base = weekBars.values;
    const pad = (n: number) => base.map((v, i) => Math.max(0, v + ((i + n) % 3) - 1));
    return {
      projects: pad(1).map((v) => v + Math.max(1, totalCount)),
      active: pad(2).map((v) => v + activeCount),
      deadlines: pad(3),
      sessions: base.length ? base : [0, 1, 0, 2, 1, 3, 2],
    };
  }, [weekBars.values, totalCount, activeCount]);

  const openNeural = () => {
    navigate("/assistant");
  };

  const activeDisplay = useAnimatedCounter(loading ? 0 : activeCount, 900, !loading);

  return (
    <motion.div className="page-shell" variants={staggerContainer} initial="hidden" animate="show" inherit={false}>
      <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
        <div data-tour="dashboard-welcome">
          <p className="eyebrow mb-1">Overview</p>
          <h1 className="page-title">Welcome back, {user?.firstName || "Developer"}</h1>
        </div>
        <Button data-tour="dashboard-create-project" onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New project
        </Button>
      </motion.div>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {loadError}
        </div>
      )}

      <motion.div variants={staggerItem} className="bento-grid">
        <BentoCard
          variant="filled"
          accent="violet"
          span="col-span-12 xl:col-span-5"
          className="min-h-[200px] relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full bg-white/20 blur-2xl animate-orb-drift pointer-events-none" />
          <div className="absolute right-16 bottom-0 w-32 h-32 rounded-full bg-violet-300/30 blur-2xl animate-orb-drift pointer-events-none" style={{ animationDelay: "1.5s" }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <PlayCircle size={18} />
            </div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Hero</span>
          </div>
          <div className="relative z-10 mt-6">
            <p className="text-sm font-medium text-white/80">Active</p>
            <p className="font-heading text-5xl font-bold tabular-nums tracking-tight mt-1">
              {activeDisplay}
            </p>
            <p className="text-xs text-white/70 mt-2">Currently in flight — your workspace pulse</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 opacity-40">
            <Sparkline data={sparklines.active} color="rgba(255,255,255,0.95)" height={64} />
          </div>
        </BentoCard>
        <StatCard
          span="col-span-6 xl:col-span-2"
          icon={FolderKanban}
          accent="indigo"
          label="Projects"
          value={loading ? 0 : summary?.totalProjects ?? 0}
          hint="Total workspaces"
          sparkline={sparklines.projects}
        />
        <StatCard
          span="col-span-6 xl:col-span-2"
          icon={CalendarClock}
          accent="coral"
          label="Deadlines"
          value={loading ? 0 : summary?.deadlinesSoon?.length ?? 0}
          hint="Coming up soon"
          sparkline={sparklines.deadlines}
        />
        <StatCard
          span="col-span-12 xl:col-span-3"
          icon={Timer}
          accent="emerald"
          label="Sessions"
          value={loading ? 0 : summary?.recentSessions?.length ?? 0}
          hint="Recent activity"
          sparkline={sparklines.sessions}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="bento-grid">
        <BentoCard span="col-span-12 xl:col-span-8" className="min-h-[300px]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-lg font-bold">This week&apos;s sessions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Hover a day for hours · click for session notes</p>
            </div>
            <span className="text-xs font-semibold text-brand">
              {weekBars.values.reduce((a, b) => a + b, 0)} logs
            </span>
          </div>
          <MiniBarRow values={weekBars.values} labels={weekBars.labels} details={weekBars.details} />
        </BentoCard>

        <div className="col-span-12 xl:col-span-4 ai-surface min-h-[300px] p-6 flex flex-col justify-between">
          <div className="relative z-10">
            <div className="absolute -right-6 -top-10 w-40 h-40 rounded-full bg-brand/25 blur-3xl animate-orb-drift" />
            <Sparkles className="mb-3 text-brand" size={22} />
            <h2 className="font-heading text-2xl font-bold leading-tight text-slate-900 dark:text-white">
              Ask Neural AI
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-3 leading-relaxed">
              Status, deadlines, next steps — open Assistant for workspace-wide Neural.
            </p>
          </div>
          <div className="space-y-2 mt-6 relative z-10">
            {["What's blocked?", "Summarize progress"].map((q) => (
              <button
                key={q}
                type="button"
                onClick={openNeural}
                className="w-full text-left text-sm px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 border border-brand/10 active:scale-[0.98] transition-transform"
              >
                {q}
              </button>
            ))}
            <Button
              onClick={openNeural}
              className="h-10 w-full rounded-full bg-brand hover:bg-brand-soft text-white font-semibold shadow-glow"
            >
              Open Assistant
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="bento-grid">
        <BentoCard span="col-span-12 xl:col-span-8" className="flex flex-col sm:flex-row sm:items-center gap-6 min-h-[240px]">
          <ProgressRing value={healthPct} accent="violet" label="Active share" size={160} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">Resume session</p>
            {loading ? (
              <div className="h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
            ) : resumeProject ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {resumeProject.name}
                  </h2>
                  <StatusPill value={resumeProject.status} />
                </div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {resumeSummary || "No recent session summary yet — jump back in whenever you're ready."}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {resumeTime ? format(new Date(resumeTime), "MMM d, h:mm a") : "—"}
                  {resumeDuration != null ? ` · ${resumeDuration} min` : ""}
                </p>
                <Button onClick={() => navigate(`/project/${resumeProject._id}`)} className="btn-primary mt-5">
                  Resume
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-500">No session to resume yet. Create a project to get started.</p>
            )}
          </div>
        </BentoCard>

        <BentoCard span="col-span-12 xl:col-span-4" className="min-h-[240px]">
          <h2 className="font-heading text-lg font-bold mb-4">Needs attention</h2>
          <div className="space-y-2">
            {(summary?.deadlinesSoon || []).map((proj) => (
              <div key={proj.name} className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 px-3 py-3">
                <p className="text-sm font-semibold truncate">{proj.name}</p>
                <p className="text-xs text-rose-500 mt-1">{format(new Date(proj.deadline), "MMM d")} deadline</p>
              </div>
            ))}
            {(summary?.inactiveProjects || []).map((proj) => (
              <div key={proj.name} className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 px-3 py-3">
                <p className="text-sm font-semibold truncate">{proj.name}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {Math.floor((Date.now() - new Date(proj.lastWorkedAt).getTime()) / 86400000)}d idle
                </p>
              </div>
            ))}
            {!summary?.deadlinesSoon?.length && !summary?.inactiveProjects?.length && (
              <p className="text-sm text-slate-400">You're all caught up.</p>
            )}
          </div>
        </BentoCard>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Recent projects</h2>
        <Link to="/projects" className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      </motion.div>
      <motion.div variants={staggerItem}>
        <ProjectsGrid limit={6} />
      </motion.div>

      <ProjectCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(projectId) => {
          setIsModalOpen(false);
          if (user?.id) {
            getDashboardSummary(user.id).then((data) => setSummary(data)).catch(() => {});
          }
          if (projectId) {
            triggerFirstProjectTour(projectId);
          }
        }}
      />
    </motion.div>
  );
}

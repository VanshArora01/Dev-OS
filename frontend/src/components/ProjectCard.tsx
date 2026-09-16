import { Link } from "react-router-dom";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Project } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { AvatarCluster } from "@/components/ui/avatar-cluster";
import SpotlightCard from "@/components/SpotlightCard/SpotlightCard";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { truncateText } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Accent } from "@/lib/accents";

interface ProjectCardProps {
  project: Project;
  onDelete?: () => void;
}

const TYPE_ACCENT: Record<string, Accent> = {
  personal: "sky",
  freelance: "violet",
  company: "emerald",
};

const TYPE_SPOTLIGHT: Record<string, string> = {
  personal: "rgba(14, 165, 233, 0.35)",
  freelance: "rgba(108, 92, 231, 0.4)",
  company: "rgba(16, 185, 129, 0.35)",
};

const TYPE_WASH: Record<string, string> = {
  personal: "from-sky-500/25 via-sky-400/10 to-transparent",
  freelance: "from-violet-500/30 via-brand/10 to-transparent",
  company: "from-emerald-500/25 via-emerald-400/10 to-transparent",
};

const TYPE_GLOW: Record<string, string> = {
  personal: "group-hover:shadow-[0_18px_40px_-16px_rgba(14,165,233,0.45)]",
  freelance: "group-hover:shadow-[0_18px_40px_-16px_rgba(108,92,231,0.5)]",
  company: "group-hover:shadow-[0_18px_40px_-16px_rgba(16,185,129,0.45)]",
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const people = [
    ...(project.teamMembers || []).map((m) => m.name),
    ...(project.stakeholders || []).map((s) => s.name),
    project.owner?.name,
  ].filter(Boolean) as string[];
  const done = project.planning?.milestones?.filter((m) => m.status === "completed").length || 0;
  const total = project.planning?.milestones?.length || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const accent = TYPE_ACCENT[project.type] || "violet";
  const doneCount = useAnimatedCounter(done, 700, true);

  return (
    <Link to={`/project/${project._id}`} className="block group h-full [perspective:900px]">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-3xl transition-shadow", TYPE_GLOW[project.type] || TYPE_GLOW.freelance)}
      >
        <SpotlightCard
          spotlightColor={TYPE_SPOTLIGHT[project.type] || TYPE_SPOTLIGHT.freelance}
          className="h-full min-h-[248px] !p-0 border-slate-200/60"
        >
          <div
            className={cn(
              "h-28 bg-gradient-to-br px-5 pt-5 relative overflow-hidden",
              TYPE_WASH[project.type] || TYPE_WASH.freelance
            )}
          >
            <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/30 blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-2 relative z-10">
              <StatusPill value={project.type} />
              <span className="h-8 w-8 rounded-full bg-white/85 dark:bg-black/30 flex items-center justify-center text-slate-500 group-hover:text-brand transition-colors">
                <ArrowUpRight size={15} />
              </span>
            </div>
          </div>
          <div className="px-5 pb-5 flex flex-col gap-3 flex-1 -mt-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {project.name}
              </h3>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-slate-300 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <StatusPill value={project.status} />
            <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed flex-1">
              {truncateText(project.description, 110) || "No description yet"}
            </p>
            {total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Trajectory</span>
                  <span className="tabular-nums font-semibold text-slate-600 dark:text-zinc-300">
                    {doneCount}/{total}
                  </span>
                </div>
                <AnimatedProgress value={pct} accent={accent} />
              </div>
            )}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.12 }}
            >
              <AvatarCluster names={people.length ? people : [project.name]} />
            </motion.div>
          </div>
        </SpotlightCard>
      </motion.div>
    </Link>
  );
}

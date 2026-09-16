import { CheckCircle2, Circle, Plus, Trash2, Target, Users, AlertCircle, FileText, Flag } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project } from "@/lib/types";
import { BentoCard } from "@/components/ui/bento-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PillTabBar } from "@/components/ui/pill-tab-bar";
import { cn } from "@/lib/utils";

interface ProjectBriefTabProps {
  project: Project;
  newDeliverable: string;
  setNewDeliverable: (value: string) => void;
  handleUpdateProjectFlat: (update: Partial<Project>, options?: { silent?: boolean }) => void;
  handleAddDeliverable: () => void;
}

const TOP_SECTIONS = [
  { id: "vision", label: "Vision" },
  { id: "technical", label: "Technical" },
  { id: "constraints", label: "Constraints" },
  { id: "outcomes", label: "Outcomes" },
];

const VISION_PANES = [
  { id: "overview", label: "Project overview", icon: FileText },
  { id: "problem", label: "Problem", icon: AlertCircle },
  { id: "objective", label: "Objective", icon: Target },
  { id: "users", label: "Target users", icon: Users },
  { id: "scope", label: "Scope", icon: Flag },
] as const;

export function ProjectBriefTab({
  project,
  newDeliverable,
  setNewDeliverable,
  handleUpdateProjectFlat,
  handleAddDeliverable,
}: ProjectBriefTabProps) {
  const done = project.requirements?.deliverablesChecklist?.filter((d) => d.done).length || 0;
  const total = project.requirements?.deliverablesChecklist?.length || 0;
  const pct = Math.round((done / (total || 1)) * 100);
  const [activeSection, setActiveSection] = useState("vision");
  const [visionPane, setVisionPane] = useState<(typeof VISION_PANES)[number]["id"]>("overview");

  const problem =
    project.requirements?.clientRequirements ||
    project.description ||
    "Define the core problem this project exists to solve.";

  const paneValue = (id: typeof visionPane) => {
    if (id === "overview") return project.description || "";
    if (id === "problem") return project.requirements?.clientRequirements || "";
    if (id === "objective") return project.nextPlannedStep || "";
    if (id === "users") return project.requirements?.constraints || "";
    return project.requirements?.technicalRequirements || "";
  };

  const savePane = (id: typeof visionPane, v: string) => {
    if (id === "overview") handleUpdateProjectFlat({ description: v });
    else if (id === "objective") handleUpdateProjectFlat({ nextPlannedStep: v });
    else if (id === "problem")
      handleUpdateProjectFlat({ requirements: { ...project.requirements, clientRequirements: v } });
    else if (id === "users")
      handleUpdateProjectFlat({ requirements: { ...project.requirements, constraints: v } });
    else handleUpdateProjectFlat({ requirements: { ...project.requirements, technicalRequirements: v } });
  };

  const activeVision = VISION_PANES.find((p) => p.id === visionPane)!;
  const VisionIcon = activeVision.icon;

  return (
    <div className="space-y-5">
      <BentoCard className="relative overflow-hidden !p-8 md:!p-10" hoverLift={false}>
        <p className="eyebrow mb-3">Problem</p>
        <blockquote className="font-heading text-2xl md:text-3xl font-bold tracking-tight leading-snug text-slate-900 dark:text-white border-l-4 border-brand pl-5">
          {problem}
        </blockquote>
      </BentoCard>

      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-background/90 backdrop-blur-md space-y-3">
        <PillTabBar
          tabs={TOP_SECTIONS}
          activeId={activeSection}
          onChange={setActiveSection}
          layoutId="brief-section-pill"
        />
        {activeSection === "vision" && (
          <div className="flex flex-wrap gap-1.5">
            {VISION_PANES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setVisionPane(p.id)}
                className={cn(
                  "relative h-8 px-3.5 rounded-full text-xs font-semibold transition-colors",
                  visionPane === p.id ? "text-white" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {visionPane === p.id && (
                  <motion.span
                    layoutId="brief-vision-pane-pill"
                    className="absolute inset-0 rounded-full bg-brand shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-12 xl:col-span-8 min-h-[420px]">
          <AnimatePresence mode="wait">
            {activeSection === "outcomes" ? (
              <motion.div
                key="outcomes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <BentoCard className="min-h-[420px] flex flex-col" hoverLift={false}>
                  <p className="font-heading text-lg font-bold mb-4">Outcome matrix</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 content-start">
                    {project.requirements?.deliverablesChecklist
                      ?.slice()
                      .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] px-3 py-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const checklist = [...(project.requirements?.deliverablesChecklist || [])];
                              const realIdx = project.requirements?.deliverablesChecklist?.indexOf(item);
                              if (realIdx !== undefined && realIdx !== -1) {
                                checklist[realIdx].done = !checklist[realIdx].done;
                                handleUpdateProjectFlat({
                                  requirements: { ...project.requirements, deliverablesChecklist: checklist },
                                });
                              }
                            }}
                          >
                            {item.done ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <Circle size={16} className="text-slate-300" />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-sm leading-snug ${item.done ? "line-through text-slate-400" : ""}`}
                          >
                            {item.item}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const checklist = project.requirements?.deliverablesChecklist?.filter((d) => d !== item);
                              handleUpdateProjectFlat({
                                requirements: { ...project.requirements, deliverablesChecklist: checklist },
                              });
                            }}
                            className="text-slate-300 hover:text-rose-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                  </div>
                  <div className="flex items-center gap-2 pt-4 mt-auto">
                    <Plus size={14} className="text-slate-300" />
                    <input
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDeliverable())}
                      placeholder="Add deliverable"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-300"
                    />
                  </div>
                </BentoCard>
              </motion.div>
            ) : activeSection === "vision" ? (
              <motion.div
                key={`vision-${visionPane}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <BentoCard className="min-h-[420px] flex flex-col" hoverLift={false}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <VisionIcon size={26} />
                    </span>
                    <div>
                      <p className="eyebrow">Vision</p>
                      <h3 className="font-heading text-xl font-bold">{activeVision.label}</h3>
                    </div>
                  </div>
                  <textarea
                    key={visionPane}
                    defaultValue={paneValue(visionPane)}
                    onBlur={(e) => savePane(visionPane, e.target.value)}
                    className="w-full flex-1 min-h-[280px] bg-transparent text-[16px] leading-8 text-slate-700 dark:text-zinc-300 focus:outline-none resize-none placeholder:text-slate-300"
                    placeholder={`Write the ${activeVision.label.toLowerCase()}…`}
                  />
                </BentoCard>
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <BentoCard className="min-h-[420px] flex flex-col" hoverLift={false}>
                  <p className="font-heading text-lg font-bold mb-3">
                    {activeSection === "technical" ? "Technical strategy" : "Hard constraints"}
                  </p>
                  <textarea
                    key={activeSection}
                    defaultValue={
                      activeSection === "technical"
                        ? project.requirements?.technicalRequirements
                        : project.requirements?.constraints
                    }
                    onBlur={(e) =>
                      handleUpdateProjectFlat({
                        requirements: {
                          ...project.requirements,
                          [activeSection === "technical" ? "technicalRequirements" : "constraints"]: e.target.value,
                        },
                      })
                    }
                    className="w-full flex-1 min-h-[320px] bg-transparent text-[16px] leading-8 text-slate-700 dark:text-zinc-300 focus:outline-none resize-none placeholder:text-slate-300"
                    placeholder={
                      activeSection === "technical"
                        ? "Architecture, stack, and deployment"
                        : "Deadlines, budget, platform limits"
                    }
                  />
                </BentoCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BentoCard
          variant="filled"
          accent="violet"
          span="col-span-12 xl:col-span-4"
          className="min-h-[320px] flex flex-col items-center justify-center gap-4 self-start sticky top-24"
          hoverLift={false}
        >
          <p className="text-white/70 text-sm font-medium">Brief completion</p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection("outcomes")}
            className="focus:outline-none"
          >
            <ProgressRing value={pct} inverted label={`${done}/${total} outcomes`} size={168} />
          </motion.button>
          <div className="w-full space-y-1.5 px-2">
            {(project.requirements?.deliverablesChecklist || []).slice(0, 4).map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSection("outcomes")}
                className="w-full text-left text-xs px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/85 truncate"
              >
                {item.done ? "✓ " : "○ "}
                {item.item}
              </button>
            ))}
          </div>
          <p className="text-sm text-white/70 text-center px-4">
            {pct >= 100 ? "Every outcome is checked." : "Tap ring or a segment → Outcomes pane."}
          </p>
        </BentoCard>
      </div>
    </div>
  );
}

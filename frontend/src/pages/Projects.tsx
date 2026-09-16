import { Plus } from "lucide-react";
import ProjectsGrid from "@/components/ProjectsGrid";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProjectCreationModal from "@/components/ProjectCreationModal";
import { PillTabBar } from "@/components/ui/pill-tab-bar";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "personal", label: "Personal" },
  { id: "freelance", label: "Freelance" },
  { id: "company", label: "Company" },
];
const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
];

export default function Projects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | Project["type"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all");

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Projects</p>
          <h1 className="page-title">All projects</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} className="mr-1.5" />
          New project
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 w-16 shrink-0">
            Type
          </span>
          <PillTabBar
            tabs={TYPE_FILTERS}
            activeId={typeFilter}
            onChange={(id) => setTypeFilter(id as typeof typeFilter)}
            layoutId="projects-type-pill"
            className="bg-white dark:bg-[#12121a] shadow-rest border-slate-200/80"
          />
        </div>

        <div className="h-px bg-slate-200/70 dark:bg-white/[0.06]" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 w-16 shrink-0">
            Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                  className={cn(
                    "relative h-8 px-3.5 rounded-full text-sm font-medium transition-colors",
                    active
                      ? "text-brand"
                      : "text-slate-400 border border-transparent hover:border-slate-200 hover:text-slate-600"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="projects-status-underline"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-brand"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProjectsGrid typeFilter={typeFilter} statusFilter={statusFilter} />

      <ProjectCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

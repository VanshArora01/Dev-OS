import {
  ExternalLink,
  Figma,
  Github,
  Globe,
  Link as LinkIcon,
  Link2,
  Trash2,
  Check,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { BentoCard } from "@/components/ui/bento-card";
import { IconChip } from "@/components/ui/icon-chip";
import SpotlightCard from "@/components/SpotlightCard/SpotlightCard";
import type { Accent } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type UpdateFn = (update: Partial<Project>, options?: { silent?: boolean; throwOnError?: boolean }) => Promise<unknown> | void;

interface ProjectStackTabProps {
  project: Project;
  handleUpdateProjectFlat: UpdateFn;
}

const TECH_BRAND: Record<string, string> = {
  react: "hover:shadow-[0_8px_28px_-8px_rgba(97,218,251,0.55)] hover:border-sky-300 hover:text-sky-600",
  "react.js": "hover:shadow-[0_8px_28px_-8px_rgba(97,218,251,0.55)] hover:border-sky-300 hover:text-sky-600",
  node: "hover:shadow-[0_8px_28px_-8px_rgba(104,160,99,0.55)] hover:border-emerald-300 hover:text-emerald-700",
  "node.js": "hover:shadow-[0_8px_28px_-8px_rgba(104,160,99,0.55)] hover:border-emerald-300 hover:text-emerald-700",
  typescript: "hover:shadow-[0_8px_28px_-8px_rgba(49,120,198,0.55)] hover:border-blue-300 hover:text-blue-700",
  postgresql: "hover:shadow-[0_8px_28px_-8px_rgba(51,103,145,0.55)] hover:border-indigo-300 hover:text-indigo-800",
  postgres: "hover:shadow-[0_8px_28px_-8px_rgba(51,103,145,0.55)] hover:border-indigo-300 hover:text-indigo-800",
  python: "hover:shadow-[0_8px_28px_-8px_rgba(55,118,171,0.55)] hover:border-amber-300 hover:text-amber-800",
  next: "hover:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.35)] hover:border-slate-400",
  "next.js": "hover:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.35)] hover:border-slate-400",
};

const FALLBACK_GLOW = [
  "hover:shadow-[0_8px_24px_-8px_rgba(108,92,231,0.45)] hover:border-violet-300 hover:text-violet-700",
  "hover:shadow-[0_8px_24px_-8px_rgba(14,165,233,0.45)] hover:border-sky-300 hover:text-sky-700",
  "hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.45)] hover:border-emerald-300 hover:text-emerald-700",
];

function techGlow(name: string, index: number) {
  return TECH_BRAND[name.toLowerCase()] || FALLBACK_GLOW[index % FALLBACK_GLOW.length];
}

const TECH_SUGGESTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Next.js", "Python", "Go",
  "PostgreSQL", "MongoDB", "Redis", "Tailwind CSS", "Electron", "GraphQL",
  "Docker", "AWS", "Prisma", "Express", "FastAPI", "Rust", "Kotlin",
];

function SortableTechPill({
  id,
  index,
  onRemove,
}: {
  id: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative inline-flex items-center justify-center h-9 min-w-[4.5rem] pl-4 pr-8 rounded-full bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-sm font-semibold whitespace-nowrap select-none transition-shadow",
        techGlow(id, index)
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        {id}
      </button>
      <button
        type="button"
        aria-label={`Remove ${id}`}
        onClick={onRemove}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 flex items-center justify-center"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function UrlField({
  value,
  placeholder,
  onCommit,
}: {
  value?: string;
  placeholder: string;
  onCommit: (url: string) => void;
}) {
  const [draft, setDraft] = useState(value || "");
  const [committed, setCommitted] = useState(Boolean(value));

  useEffect(() => {
    setDraft(value || "");
    setCommitted(Boolean(value));
  }, [value]);

  const looksLikeUrl = /^https?:\/\//i.test(draft.trim());

  if (committed && draft) {
    return (
      <a
        href={draft}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-2 rounded-xl bg-white/80 dark:bg-black/25 border border-slate-200/80 dark:border-white/10 px-3 py-2.5 text-sm hover:border-brand/40 transition-colors"
      >
        <span className="h-7 w-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <Link2 size={14} />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-zinc-200">
          {draft.replace(/^https?:\/\//, "")}
        </span>
        <ExternalLink size={13} className="text-slate-300 group-hover:text-brand" />
        <button
          type="button"
          className="text-[11px] font-semibold text-slate-400 hover:text-brand"
          onClick={(e) => {
            e.preventDefault();
            setCommitted(false);
          }}
        >
          Edit
        </button>
      </a>
    );
  }

  return (
    <div className="relative">
      <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={() => {
          window.setTimeout(() => {
            /* paste settles into controlled value on next tick via onChange */
          }, 0);
        }}
        onBlur={() => {
          if (draft.trim()) {
            onCommit(draft.trim());
            setCommitted(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onCommit(draft.trim());
            setCommitted(true);
          }
        }}
        placeholder={placeholder}
        className="pl-9 h-11 rounded-xl bg-white/80 dark:bg-black/20 border-slate-200/80"
      />
      {looksLikeUrl && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
          <Check size={14} />
        </span>
      )}
    </div>
  );
}

export function ProjectStackTab({ project, handleUpdateProjectFlat }: ProjectStackTabProps) {
  const assets: {
    label: string;
    val?: string;
    icon: typeof Github;
    key: "repoUrl" | "figma" | "docsUrl";
    accent: Accent;
    spotlight: string;
    orb: string;
  }[] = [
    {
      label: "Repository",
      val: project.repoUrl,
      icon: Github,
      key: "repoUrl",
      accent: "violet",
      spotlight: "rgba(139, 92, 246, 0.35)",
      orb: "bg-violet-500/30",
    },
    {
      label: "System design",
      val: project.reference?.figmaLinks?.[0],
      icon: Figma,
      key: "figma",
      accent: "coral",
      spotlight: "rgba(244, 63, 94, 0.35)",
      orb: "bg-rose-500/30",
    },
    {
      label: "Knowledge base",
      val: project.docsUrl,
      icon: Globe,
      key: "docsUrl",
      accent: "sky",
      spotlight: "rgba(14, 165, 233, 0.35)",
      orb: "bg-sky-500/30",
    },
  ];

  const [techOrder, setTechOrder] = useState(project.techStack || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTech, setNewTech] = useState("");
  const [techSaving, setTechSaving] = useState(false);
  const [techError, setTechError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setTechOrder(project.techStack || []);
  }, [project.techStack]);

  const ids = useMemo(() => techOrder, [techOrder]);

  const persistTech = async (next: string[], previous: string[]) => {
    setTechOrder(next);
    setTechSaving(true);
    setTechError(null);
    try {
      await handleUpdateProjectFlat({ techStack: next }, { silent: true, throwOnError: true });
    } catch (err: any) {
      setTechOrder(previous);
      setTechError(err?.message || "Could not update tech stack");
    } finally {
      setTechSaving(false);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = techOrder.indexOf(String(active.id));
    const newIndex = techOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    persistTech(arrayMove(techOrder, oldIndex, newIndex), techOrder);
  };

  const addTech = () => {
    const value = newTech.trim();
    if (!value) return;
    if (techOrder.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTechError("That technology is already on the stack");
      return;
    }
    setNewTech("");
    persistTech([...techOrder, value], techOrder);
  };

  const removeTech = (name: string) => {
    persistTech(techOrder.filter((t) => t !== name), techOrder);
  };

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg font-bold">Stack & vault</h2>

      <div className="bento-grid">
        {assets.map((asset, i) => (
          <motion.div
            key={asset.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            className="col-span-12 xl:col-span-4"
          >
            <SpotlightCard spotlightColor={asset.spotlight} className="min-h-[220px] p-5 flex flex-col gap-3 h-full">
              <div className="relative">
                <span className={cn("absolute -left-2 -top-2 h-16 w-16 rounded-full blur-2xl", asset.orb)} />
                <IconChip icon={asset.icon} accent={asset.accent} />
              </div>
              <p className="font-heading text-lg font-bold">{asset.label}</p>
              <UrlField
                value={asset.val}
                placeholder="Paste URL"
                onCommit={(url) => {
                  if (asset.key === "figma") {
                    handleUpdateProjectFlat({
                      reference: { ...project.reference, figmaLinks: [url] },
                    });
                  } else {
                    handleUpdateProjectFlat({ [asset.key]: url });
                  }
                }}
              />
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      <BentoCard>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="font-heading text-base font-bold">Tech in play</p>
            {techSaving && <Loader2 size={14} className="animate-spin text-slate-400" />}
          </div>
          <p className="text-xs text-slate-400 mb-3">Drag to reorder, hover a pill to remove, or add a technology</p>
          <div className="flex gap-2 mb-3">
            <input
              list="devos-tech-suggestions"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
              placeholder="Add technology"
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent text-sm"
            />
            <datalist id="devos-tech-suggestions">
              {TECH_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <Button type="button" onClick={addTech} disabled={techSaving || !newTech.trim()} className="btn-primary h-10">
              <Plus size={14} className="mr-1.5" />
              Add
            </Button>
          </div>
          {techError && <p className="text-xs text-rose-500 mb-2">{techError}</p>}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(String(e.active.id))}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
                {techOrder.length === 0 && (
                  <p className="text-sm text-slate-400">No technologies yet.</p>
                )}
                {techOrder.map((t, i) => (
                  <SortableTechPill key={t} id={t} index={i} onRemove={() => removeTech(t)} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <span className="inline-flex items-center justify-center h-9 min-w-[4.5rem] px-4 rounded-full bg-brand text-white text-sm font-semibold whitespace-nowrap shadow-lift cursor-grabbing">
                  {activeId}
                </span>
              ) : null}
            </DragOverlay>
          </DndContext>
        </BentoCard>

      <div className="bento-grid">
        <BentoCard span="col-span-12 xl:col-span-7" className="min-h-[240px]">
          <div className="flex items-center justify-between mb-4">
            <p className="font-heading text-base font-bold">Vault</p>
            <Button
              onClick={() => {
                const label = prompt("Resource name?");
                const url = prompt("URL?");
                if (label && url) {
                  handleUpdateProjectFlat({ resources: [...(project.resources || []), { label, url }] });
                }
              }}
              className="btn-primary h-9"
            >
              Add link
            </Button>
          </div>
          {!project.resources || project.resources.length === 0 ? (
            <p className="text-sm text-slate-400 py-8">No resources yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.resources.map((res, idx) => (
                <div
                  key={res._id || idx}
                  className="group rounded-2xl bg-slate-50 dark:bg-white/[0.04] p-3 flex items-start gap-3"
                >
                  <IconChip icon={LinkIcon} accent="indigo" size="sm" />
                  <a href={res.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{res.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{res.url.replace(/^https?:\/\//, "")}</p>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateProjectFlat({ resources: project.resources?.filter((_, i) => i !== idx) })
                    }
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        <BentoCard span="col-span-12 xl:col-span-5" className="min-h-[240px] flex flex-col">
          <p className="font-heading text-base font-bold mb-3">Design notes</p>
          <textarea
            defaultValue={project.reference?.styleNotes}
            onBlur={(e) =>
              handleUpdateProjectFlat({ reference: { ...project.reference, styleNotes: e.target.value } })
            }
            className="w-full flex-1 min-h-[160px] bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-slate-300 resize-none"
            placeholder="Aesthetic direction, type, color"
          />
        </BentoCard>
      </div>
    </div>
  );
}

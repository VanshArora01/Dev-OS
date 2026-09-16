import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import type { Project } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { BentoCard } from "@/components/ui/bento-card";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectKanbanTabProps {
  project: Project;
  columns: any;
  onDragEnd: (result: DropResult) => void;
  handleUpdateProjectFlat: (update: Partial<Project>) => void;
}

const COLUMN_STYLE: Record<string, { head: string; rail: string; glow: string }> = {
  todo: {
    head: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    rail: "border-rose-200 dark:border-rose-500/20",
    glow: "ring-rose-400/50 bg-rose-50/80 dark:bg-rose-500/10",
  },
  inProgress: {
    head: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    rail: "border-amber-200 dark:border-amber-500/20",
    glow: "ring-amber-400/50 bg-amber-50/80 dark:bg-amber-500/10",
  },
  done: {
    head: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    rail: "border-emerald-200 dark:border-emerald-500/20",
    glow: "ring-emerald-400/60 bg-emerald-50/90 dark:bg-emerald-500/15 shadow-[0_0_32px_-8px_rgba(16,185,129,0.55)]",
  },
};

function AnimatedCount({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 140, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [text, setText] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on("change", (v) => setText(v));
  }, [display]);

  return <span className="tabular-nums">{text}</span>;
}

export function ProjectKanbanTab({ project, columns, onDragEnd, handleUpdateProjectFlat }: ProjectKanbanTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const celebrateSeed = useRef(0);

  const handleDragEnd = (result: DropResult) => {
    const landingInDone = result.destination?.droppableId === "done" && result.source.droppableId !== "done";
    onDragEnd(result);
    if (landingInDone && result.draggableId) {
      celebrateSeed.current += 1;
      setCelebrateId(result.draggableId);
      toast.success("Marked complete — nice work");
      window.setTimeout(() => setCelebrateId(null), 800);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-210px)]">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Board</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag with weight — Completed is the payoff.
          </p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {(Object.entries(columns) as [string, any][]).map(([columnId, column]) => {
            const style = COLUMN_STYLE[columnId] || COLUMN_STYLE.todo;
            return (
              <div key={columnId} className="flex flex-col min-h-[560px] relative">
                <div className={cn("flex items-center justify-between px-4 py-2.5 rounded-2xl mb-3", style.head)}>
                  <h3 className="text-sm font-bold">{column.title}</h3>
                  <span className="h-6 min-w-6 px-1.5 rounded-full bg-white/70 dark:bg-black/20 text-xs font-bold flex items-center justify-center">
                    <AnimatedCount value={column.items.length} />
                  </span>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 rounded-3xl p-3 border-2 border-dashed space-y-3 transition-all duration-200",
                        style.rail,
                        snapshot.isDraggingOver
                          ? cn("ring-2", style.glow)
                          : "bg-slate-50/80 dark:bg-white/[0.03]"
                      )}
                    >
                      {column.items.map((item: any, index: number) => {
                        const id = item._id || item.title;
                        const isOpen = expanded === id;
                        return (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging
                                    ? `${provided.draggableProps.style?.transform || ""} rotate(2.5deg)`
                                    : provided.draggableProps.style?.transform,
                                }}
                                className="relative"
                              >
                                <AnimatePresence>
                                  {celebrateId === id && <ConfettiBurst seed={celebrateSeed.current} />}
                                </AnimatePresence>
                                <motion.div
                                  animate={
                                    celebrateId === id
                                      ? { scale: [1, 1.06, 1], backgroundColor: ["", "rgba(16,185,129,0.12)", ""] }
                                      : { scale: 1 }
                                  }
                                  transition={{ duration: 0.45 }}
                                >
                                  <BentoCard
                                    className={cn(
                                      "!p-4 cursor-grab active:cursor-grabbing !shadow-rest",
                                      snapshot.isDragging && "!shadow-lift ring-2 ring-brand/40 rotate-[2.5deg]"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setExpanded(isOpen ? null : id)}
                                        className={cn(
                                          "text-left text-[15px] font-semibold leading-snug",
                                          !isOpen && "line-clamp-3"
                                        )}
                                      >
                                        {item.title}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated =
                                            project.planning?.milestones?.filter((m: any) => m.title !== item.title) ||
                                            [];
                                          handleUpdateProjectFlat({ planning: { milestones: updated } });
                                        }}
                                        className="text-slate-300 hover:text-rose-500 p-0.5"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    {item.description && (
                                      <p className={cn("text-xs text-slate-500 mt-2", !isOpen && "line-clamp-2")}>
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                      {item.priority && <StatusPill value={item.priority} />}
                                      {item.status && <StatusPill value={item.status} />}
                                      {item.dueDate && (
                                        <span className="text-[11px] text-slate-400">
                                          {format(new Date(item.dueDate), "MMM d")}
                                        </span>
                                      )}
                                    </div>
                                  </BentoCard>
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {columnId === "todo" && (
                        <div className="flex items-center gap-2 px-2">
                          <Plus size={14} className="text-slate-300" />
                          <input
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value) {
                                const val = e.currentTarget.value;
                                handleUpdateProjectFlat({
                                  planning: {
                                    milestones: [
                                      ...(project.planning?.milestones || []),
                                      { title: val, description: "", status: "pending" as const },
                                    ],
                                  },
                                });
                                e.currentTarget.value = "";
                                toast("Task added");
                              }
                            }}
                            placeholder="Add a task and press Enter"
                            className="w-full bg-transparent py-3 text-sm focus:outline-none placeholder:text-slate-400"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { getProjects, updateProject } from "@/lib/api";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  format,
  isToday,
  isAfter,
  startOfDay,
  addDays,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ReminderRow = {
  message: string;
  date: string | Date;
  sent?: boolean;
  projectId?: string;
  projectName: string;
  reminderIdx: number;
};

export default function Reminders() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) fetchProjects();
  }, [user?.id]);

  const fetchProjects = async () => {
    try {
      const data = await getProjects(user?.id);
      setProjects(data);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const allReminders: ReminderRow[] = projects
    .flatMap((p) =>
      (p.reminders || []).map((r, reminderIdx) => ({
        ...r,
        projectId: p._id || p.id,
        projectName: p.name,
        reminderIdx,
      }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dateRail = useMemo(() => {
    const start = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const day = addDays(start, i);
      const count = allReminders.filter((r) => isSameDay(new Date(r.date), day)).length;
      return { day, count };
    });
  }, [allReminders]);

  const filtered = useMemo(() => {
    if (!selectedDay) return allReminders;
    return allReminders.filter((r) => isSameDay(new Date(r.date), selectedDay));
  }, [allReminders, selectedDay]);

  const grouped = useMemo(() => {
    const map = new Map<string, ReminderRow[]>();
    filtered.forEach((r) => {
      const key = format(startOfDay(new Date(r.date)), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: format(new Date(key), "EEEE, MMM d"),
      items,
    }));
  }, [filtered]);

  const urgency = (date: Date) => {
    const days = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
    if (days < 0) return { label: "Overdue", className: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" };
    if (days === 0) return { label: "Today", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200" };
    if (days <= 2) return { label: `${days}d`, className: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" };
    if (days <= 7) return { label: `${days}d`, className: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200" };
    return { label: `${days}d`, className: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400" };
  };

  const handleAddReminder = async () => {
    if (!selectedProject || !reminderText || !reminderDate) {
      toast.error("Project, message, and date are required");
      return;
    }
    const project = projects.find((p) => (p._id || p.id) === selectedProject);
    if (!project) return;
    try {
      await updateProject(selectedProject, {
        reminders: [
          ...(project.reminders || []),
          { message: reminderText, date: new Date(reminderDate), sent: false },
        ],
        clerkId: user?.id,
      });
      toast.success("Reminder saved");
      fetchProjects();
      setShowAdd(false);
      setReminderText("");
    } catch {
      toast.error("Failed to save reminder");
    }
  };

  const handleDeleteReminder = async (projectId: string, reminderIdx: number) => {
    const key = `${projectId}-${reminderIdx}`;
    setDismissing(key);
    const project = projects.find((p) => (p._id || p.id) === projectId);
    if (!project) return;
    try {
      await updateProject(projectId, {
        reminders: (project.reminders || []).filter((_, i) => i !== reminderIdx),
        clerkId: user?.id,
      });
      window.setTimeout(() => {
        fetchProjects();
        setDismissing(null);
        toast.info("Reminder cleared");
      }, 280);
    } catch {
      setDismissing(null);
      toast.error("Update failed");
    }
  };

  const todayCount = allReminders.filter((r) => isToday(new Date(r.date))).length;
  const upcoming = allReminders.filter(
    (r) => isAfter(new Date(r.date), new Date()) && !isToday(new Date(r.date))
  ).length;

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Reminders</p>
          <h1 className="page-title">All reminders</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} className="mr-1.5" />
          Reminder
        </Button>
      </div>

      <div className="bento-grid">
        <StatCard
          span="col-span-12 sm:col-span-4"
          accent="violet"
          label="Total"
          value={loading ? 0 : allReminders.length}
          hint="Across projects"
        />
        <StatCard
          span="col-span-12 sm:col-span-4"
          variant="filled"
          accent="violet"
          label="Today"
          value={loading ? 0 : todayCount}
          hint="Due today"
        />
        <StatCard
          span="col-span-12 sm:col-span-4"
          accent="emerald"
          label="Upcoming"
          value={loading ? 0 : upcoming}
          hint="Later this week"
        />
      </div>

      {/* Signature: horizontal date rail */}
      <div className="rounded-3xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#12121a] p-3 shadow-rest">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next 14 days</p>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-brand"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {dateRail.map(({ day, count }) => {
            const active = selectedDay ? isSameDay(selectedDay, day) : false;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDay(active ? null : day);
                  listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "relative shrink-0 w-14 rounded-2xl py-2.5 flex flex-col items-center gap-1 border transition-all",
                  active
                    ? "bg-brand text-white border-brand shadow-glow"
                    : isToday(day)
                      ? "bg-brand/5 border-brand/30 text-brand"
                      : "bg-slate-50 dark:bg-white/[0.03] border-transparent text-slate-500 hover:border-slate-200"
                )}
              >
                <span className="text-[10px] font-bold uppercase opacity-70">{format(day, "EEE")}</span>
                <span className="font-heading text-lg font-bold leading-none">{format(day, "d")}</span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full mt-0.5",
                    count === 0
                      ? "bg-transparent"
                      : active
                        ? "bg-white"
                        : "bg-brand"
                  )}
                />
                {count > 0 && (
                  <span className={cn("text-[9px] font-bold tabular-nums", active ? "text-white/80" : "text-slate-400")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={listRef} className="rounded-3xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#12121a] overflow-hidden shadow-rest">
        {loading ? (
          <div className="h-40 animate-pulse bg-slate-50 dark:bg-white/[0.03]" />
        ) : grouped.length === 0 ? (
          <p className="text-sm text-slate-400 py-14 text-center">No reminders for this filter.</p>
        ) : (
          grouped.map((group, gi) => (
            <div key={group.key}>
              {gi > 0 && <div className="h-px bg-slate-100 dark:bg-white/[0.05]" />}
              <div className="px-5 pt-4 pb-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{group.label}</p>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {group.items.map((r, ri) => {
                    const key = `${r.projectId}-${r.reminderIdx}`;
                    const chip = urgency(new Date(r.date));
                    return (
                      <motion.li
                        key={key}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={
                          dismissing === key
                            ? { opacity: 0.35, x: 28 }
                            : { opacity: 1, x: 0, y: 0 }
                        }
                        exit={{ opacity: 0, x: 40, height: 0 }}
                        transition={{ delay: ri * 0.03, duration: 0.28 }}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(r.projectId!, r.reminderIdx)}
                          className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            r.sent
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 hover:border-brand hover:bg-brand/10"
                          )}
                        >
                          {(r.sent || dismissing === key) && <Check size={10} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-slate-800 dark:text-zinc-100">
                            {r.message}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{r.projectName}</p>
                        </div>
                        <span
                          className={cn(
                            "hidden sm:inline-flex h-6 items-center px-2 rounded-full text-[10px] font-bold shrink-0",
                            chip.className
                          )}
                        >
                          {chip.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(r.projectId!, r.reminderIdx)}
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          ))
        )}
      </div>

      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New reminder</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
            >
              <option value="" disabled>
                Select project
              </option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Message"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
            />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
            />
            <Button onClick={handleAddReminder} className="btn-primary w-full">
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

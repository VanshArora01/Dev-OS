import { Plus } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { ReminderTile } from "@/components/ui/reminder-tile";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface ProjectRemindersTabProps {
    project: Project;
    newReminder: { date: string; message: string };
    setNewReminder: (value: { date: string; message: string }) => void;
    handleAddReminder: () => void;
    handleUpdateProjectFlat: (update: Partial<Project>) => void;
}

export function ProjectRemindersTab({
    project,
    newReminder,
    setNewReminder,
    handleAddReminder,
    handleUpdateProjectFlat,
}: ProjectRemindersTabProps) {
    const items = (project.reminders || [])
        .map((rem, originalIdx) => ({ rem, originalIdx }))
        .sort((a, b) => new Date(a.rem.date).getTime() - new Date(b.rem.date).getTime());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-lg font-bold">Reminders</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{items.length} on this project</p>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="btn-primary h-9">
                            <Plus size={14} className="mr-1.5" />
                            Reminder
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>New reminder</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                            <textarea
                                value={newReminder.message}
                                onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                                className="w-full h-24 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent p-3 text-sm focus:outline-none"
                                placeholder="Message"
                            />
                            <input
                                type="date"
                                value={newReminder.date}
                                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent px-3 text-sm"
                            />
                            <Button
                                onClick={handleAddReminder}
                                disabled={!newReminder.message || !newReminder.date}
                                className="btn-primary w-full"
                            >
                                Save
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="bento-grid">
                {items.length === 0 ? (
                    <p className="col-span-12 text-sm text-slate-400 py-12 text-center">No reminders.</p>
                ) : (
                    items.map(({ rem, originalIdx }) => {
                        const isPast = !isAfter(new Date(rem.date), new Date());
                        const kind = rem.sent ? "sent" : isPast ? "due" : "pending";
                        return (
                            <div key={originalIdx} className="col-span-12 sm:col-span-6 xl:col-span-4">
                                <ReminderTile
                                    date={rem.date}
                                    title={rem.message}
                                    meta={format(new Date(rem.date), "yyyy")}
                                    kind={kind}
                                    onDelete={() => {
                                        const updated = project.reminders?.filter((_, idx) => idx !== originalIdx);
                                        handleUpdateProjectFlat({ reminders: updated });
                                    }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

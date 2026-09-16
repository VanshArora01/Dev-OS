import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, FileText, AlertTriangle, Sparkles, X, Zap } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { getProjects } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { isToday } from "date-fns";

interface Notification {
    id: string;
    type: "report_completed" | "report_generating" | "report_failed" | "ai_analysis" | "signal";
    title: string;
    message: string;
    time: string;
    read: boolean;
    projectId?: string;
}

export function NotificationBell() {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    useEffect(() => {
        if (!user?.id) return;

        const fetchNotifications = () => {
            getProjects(user.id).then((projects) => {
                const notifs: Notification[] = [];
                projects.forEach((p) => {
                    const pid = p._id || p.id || "";
                    const name = p.name || p.title || "Project";
                    const created = p.createdAt ? new Date(p.createdAt) : new Date();
                    const timeAgo = getTimeAgo(created);

                    // 1. Reminders (Signals)
                    (p.reminders || []).forEach((r: any, idx: number) => {
                        if (isToday(new Date(r.date)) && !r.sent) {
                            notifs.push({
                                id: `signal-${pid}-${idx}`,
                                type: "signal",
                                title: "Signal Alert",
                                message: `Task for ${name}: ${r.message}`,
                                time: "Active Today",
                                read: false,
                                projectId: pid
                            });
                        }
                    });

                    // 2. Reports ... (Rest of existing logic)
                    if (p.reportStatus === "completed" && p.kimiReport) {
                        notifs.push({
                            id: `report-done-${pid}`,
                            type: "report_completed",
                            title: "Report Ready",
                            message: `${name} — AI resilience report generated successfully`,
                            time: timeAgo,
                            read: false,
                            projectId: pid,
                        });
                    }
                    if (p.reportStatus === "generating") {
                        notifs.push({
                            id: `report-gen-${pid}`,
                            type: "report_generating",
                            title: "Generating Report",
                            message: `${name} — AI analysis in progress...`,
                            time: "Now",
                            read: false,
                            projectId: pid,
                        });
                    }
                    if (p.reportStatus === "failed") {
                        notifs.push({
                            id: `report-fail-${pid}`,
                            type: "report_failed",
                            title: "Report Failed",
                            message: `${name} — Report generation encountered an error`,
                            time: timeAgo,
                            read: false,
                            projectId: pid,
                        });
                    }
                });
                setNotifications(notifs.slice(0, 10));
            }).catch(() => { });
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [user?.id]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleNotificationClick = (notif: Notification) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setShowNotifications(false);
        if (notif.projectId) {
            navigate(`/project/${notif.projectId}?tab=overview`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "report_completed":
                return <CheckCheck className="w-5 h-5 text-emerald-500" />;
            case "report_generating":
                return <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />;
            case "report_failed":
                return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            case "signal":
                return <Zap className="w-5 h-5 text-rose-500 animate-pulse" />;
            default:
                return <FileText className="w-5 h-5 text-slate-400 dark:text-zinc-600" />;
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={
                    unreadCount > 0
                        ? { rotate: [0, -12, 10, -8, 6, -3, 0] }
                        : { rotate: 0 }
                }
                transition={
                    unreadCount > 0
                        ? { duration: 0.7, repeat: Infinity, repeatDelay: 4 }
                        : undefined
                }
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full bg-transparent hover:bg-white dark:hover:bg-zinc-800 transition-all group relative flex items-center justify-center"
            >
                <Bell className="w-5 h-5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-[9px] font-black text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900"
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 w-[380px] max-h-[500px] rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl z-[99999]"
                    >
                        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Signals</h3>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowNotifications(false)}
                                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                            </motion.button>
                        </div>

                        <div className="overflow-y-auto max-h-[380px] scrollbar-none">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800 border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center">
                                        <Bell className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">All Clear</p>
                                </div>
                            ) : (
                                notifications.map((notif, i) => (
                                    <motion.button
                                        key={notif.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left p-6 border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all group flex gap-4 ${notif.read ? "opacity-50" : ""}`}
                                    >
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{notif.title}</p>
                                                <span className="text-[9px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-widest">{notif.time}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 leading-relaxed">{notif.message}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="w-full py-4 bg-slate-50 dark:bg-zinc-950/80 text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em] hover:text-indigo-600 transition-colors border-t border-slate-100 dark:border-zinc-800"
                            >
                                Clear All
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

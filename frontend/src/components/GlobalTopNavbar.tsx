import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    FolderKanban, 
    Bell, 
    Settings, 
    Zap 
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { DevOSLogo } from "@/components/DevOSLogo";

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

export function GlobalTopNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const navLinks = [
        { title: "Overview", icon: LayoutDashboard, path: "/" },
        { title: "Projects", icon: FolderKanban, path: "/projects" },
        { title: "Signals", icon: Bell, path: "/reminders" },
    ];

    return (
        <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-zinc-900 bg-white/70 dark:bg-black/70 backdrop-blur-xl transition-colors duration-500"
        >
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
                {/* Brand */}
                <div 
                    className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-all"
                    onClick={() => navigate("/")}
                >
                    <div className="w-8 h-8 rounded-xl shadow-lg transform group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                        <DevOSLogo size={32} className="w-full h-full" />
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        Dev<span className="text-indigo-600">OS</span>
                    </span>
                </div>

                {/* Primary Nav */}
                <nav className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-zinc-800/50 rounded-xl border border-slate-200/50 dark:border-zinc-700/50">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `
                                px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                                ${isActive 
                                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-zinc-600' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                                }
                            `}
                        >
                            <link.icon size={14} className={location.pathname === link.path ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-40'} />
                            {link.title}
                        </NavLink>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-zinc-800">
                        <ThemeToggle />
                        <NotificationBell />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/settings')}
                            className="w-8 h-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <Settings size={16} />
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                <Zap size={10} fill="currentColor" /> Neural Sync
                            </span>
                        </div>
                        <div className="p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:scale-105 transition-all">
                            <UserButton 
                                appearance={{ 
                                    elements: { 
                                        avatarBox: "w-7 h-7" 
                                    } 
                                }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}

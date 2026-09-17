import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Bell,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useAuthUser } from "@/lib/auth";
import { isDemoMode, setDemoMode } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motionEase } from "@/lib/motion";
import { DevOSLogo } from "@/components/DevOSLogo";

const MENU = [
  { title: "Overview", icon: LayoutDashboard, path: "/" },
  { title: "Projects", icon: FolderKanban, path: "/projects" },
  { title: "Reminders", icon: Bell, path: "/reminders" },
  { title: "Assistant", icon: Sparkles, path: "/assistant" },
];

const COLLAPSE_KEY = "devos:sidebar-collapsed";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDemo } = useAuthUser();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const isProjectRoute = location.pathname.startsWith("/project/") || location.pathname.startsWith("/projects");
  const activePath =
    MENU.find((item) =>
      item.path === "/" ? location.pathname === "/" : 
      (item.path === "/projects" ? isProjectRoute : location.pathname.startsWith(item.path))
    )?.path ||
    (location.pathname.startsWith("/settings") ? "/settings" : null);

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 248 }}
      transition={{ duration: 0.32, ease: motionEase }}
      className="h-full shrink-0 flex flex-col bg-white dark:bg-[#101018] border-r border-slate-200/80 dark:border-white/[0.06] overflow-hidden"
    >
      <div className={cn("flex items-center h-16 px-3", collapsed ? "justify-center" : "justify-between px-4")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors",
                collapsed ? "p-2" : "px-2 py-1.5"
              )}
            >
              <span className="w-8 h-8 rounded-xl shadow-glow shrink-0 overflow-hidden">
                <DevOSLogo size={32} className="w-full h-full" />
              </span>
              {!collapsed && (
                <>
                  <span className="font-heading text-lg font-bold tracking-tight text-brand">DevOS</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuItem className="rounded-xl gap-2">
              <Check size={14} className="text-brand" />
              Personal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/settings")}>
              Workspace settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-2 h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          aria-label="Expand sidebar"
        >
          <ChevronsRight size={16} />
        </button>
      )}

      <nav className="px-3 flex-1">
        {!collapsed && <p className="eyebrow px-3 pt-2 pb-2">Menu</p>}
        <div className="relative space-y-1">
          {MENU.map((item) => {
            const active = activePath === item.path;
            const tourId = item.path === '/' ? 'sidebar-overview' :
                           item.path === '/projects' ? 'sidebar-projects' :
                           item.path === '/reminders' ? 'sidebar-reminders' :
                           item.path === '/assistant' ? 'sidebar-assistant' : undefined;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.title}
                data-tour={tourId}
                className={cn(
                  "relative flex items-center gap-3 rounded-full text-sm font-medium transition-colors z-10",
                  collapsed ? "justify-center h-11 w-11 mx-auto" : "px-3.5 py-2.5",
                  active
                    ? "text-white"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-full bg-brand shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <motion.span whileHover={{ scale: 1.08 }} className="relative z-10 shrink-0">
                  <item.icon size={18} />
                </motion.span>
                {!collapsed && <span className="relative z-10">{item.title}</span>}
              </NavLink>
            );
          })}
        </div>

        {!collapsed && <p className="eyebrow px-3 pt-6 pb-2">General</p>}
        <NavLink
          to="/settings"
          title="Settings"
          data-tour="sidebar-settings"
          className={cn(
            "relative flex items-center gap-3 rounded-full text-sm font-medium transition-colors mt-1",
            collapsed ? "justify-center h-11 w-11 mx-auto" : "px-3.5 py-2.5",
            activePath === "/settings"
              ? "text-white"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
          )}
        >
          {activePath === "/settings" && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-full bg-brand shadow-glow"
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            />
          )}
          <Settings size={18} className="relative z-10 shrink-0" />
          {!collapsed && <span className="relative z-10">Settings</span>}
        </NavLink>
      </nav>

      <div className={cn("p-3 space-y-3", collapsed && "px-2")}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl bg-gradient-to-br from-brand to-[#4c3dcc] p-4 text-white overflow-hidden"
            >
              <p className="text-sm font-semibold">Start something new</p>
              <p className="text-xs text-white/70 mt-1 mb-3">Spin up a workspace in a few seconds.</p>
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-brand text-xs font-semibold active:scale-[0.98]"
              >
                <Plus size={13} />
                New project
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.06] hover:border-brand/30 transition-colors",
                collapsed ? "justify-center p-2" : "p-2.5"
              )}
            >
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {user?.fullName || user?.firstName || "Account"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.primaryEmailAddress?.emailAddress || "Workspace"}
                  </p>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 rounded-2xl p-2">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              Account settings
            </button>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              My projects
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </motion.aside>
  );
}

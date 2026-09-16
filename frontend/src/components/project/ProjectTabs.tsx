import { useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { PROJECT_TABS, parseProjectTab } from "./tabConfig";
import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.75 };

/**
 * Project-level floating dock nav.
 * Clean segmented track — no overlay canvas, no underglow overflow.
 */
export function ProjectTabs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = parseProjectTab(searchParams.get("tab"));
  const projectMatch = location.pathname.match(/^\/project\/([^/?#]+)/);
  const trackRef = useRef<HTMLDivElement>(null);

  if (!projectMatch) return null;

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
  };

  return (
    <header className="shrink-0 z-30 px-3 lg:px-5 pt-3 pb-2">
      <div className="flex items-center gap-2 lg:gap-3 min-h-[56px] rounded-[1.75rem] border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-2xl shadow-rest px-2 py-1.5">
        {/* Back */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06] shrink-0"
        >
          <ArrowLeft size={16} strokeWidth={2.25} />
          <span className="hidden sm:inline">Projects</span>
        </motion.button>

        <div className="hidden sm:block w-px h-7 bg-slate-200/90 dark:bg-white/[0.08] shrink-0" />

        {/* Segmented pill track */}
        <nav className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div
            ref={trackRef}
            className="relative inline-flex items-center gap-0.5 min-w-max rounded-full bg-slate-100/90 dark:bg-white/[0.04] p-1 border border-slate-200/60 dark:border-white/[0.05]"
          >
            {PROJECT_TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-tour={`project-tab-${tab.id}`}
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "relative z-10 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-200",
                    active
                      ? "text-white"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="project-dock-active"
                      className="absolute inset-0 rounded-full bg-brand"
                      style={{
                        boxShadow:
                          "0 4px 14px -2px rgba(108, 92, 231, 0.55), 0 0 0 1px rgba(108, 92, 231, 0.2)",
                      }}
                      transition={spring}
                    />
                  )}
                  <motion.span
                    className="relative z-10 flex items-center gap-1.5"
                    whileHover={active ? undefined : { y: -1 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <motion.span
                      animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="inline-flex"
                    >
                      <Icon size={15} strokeWidth={active ? 2.4 : 2} />
                    </motion.span>
                    <span className="hidden lg:inline">{tab.label}</span>
                  </motion.span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Controls cluster */}
        <div className="flex items-center gap-0.5 shrink-0 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] p-0.5 pl-1">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

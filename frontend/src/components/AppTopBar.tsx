import { useLocation } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Search } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { openCommandPalette } from "@/lib/motion";

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes("Mac");
}

export function AppTopBar() {
  const location = useLocation();
  const { user } = useUser();
  const shortcut = isMacPlatform() ? "⌘K" : "Ctrl+K";

  const contextLabel = location.pathname.startsWith("/projects")
    ? "Projects"
    : location.pathname.startsWith("/reminders")
      ? "Reminders"
      : location.pathname.startsWith("/assistant")
        ? "Assistant"
        : location.pathname.startsWith("/settings")
          ? "Settings"
          : location.pathname.startsWith("/quick-links")
            ? "Quick Links"
            : location.pathname.startsWith("/api-tester")
              ? "API Console"
              : "Overview";

  return (
    <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-6 bg-white/80 dark:bg-[#101018]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => openCommandPalette()}
        className="group flex items-center gap-2.5 h-10 min-w-[220px] max-w-md flex-1 rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-4 text-slate-400 hover:border-brand/40 hover:shadow-glow transition-all duration-300"
      >
        <Search size={16} className="group-hover:text-brand transition-colors" />
        <span className="text-sm">Search {contextLabel.toLowerCase()}…</span>
        <kbd className="ml-auto hidden sm:inline text-[11px] px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-500 kbd-hint">
          {shortcut}
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2.5 pl-2 ml-1 border-l border-slate-200 dark:border-white/[0.08]">
          <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          <div className="min-w-0 hidden md:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight truncate">
              {user?.firstName || "You"}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">Workspace</p>
          </div>
        </div>
      </div>
    </header>
  );
}

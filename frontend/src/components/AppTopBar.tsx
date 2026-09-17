import { useLocation } from "react-router-dom";
import { useUser, UserButton, useClerk } from "@clerk/clerk-react";
import { Search, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { openCommandPalette } from "@/lib/motion";
import { useAuthUser } from "@/lib/auth";
import { setDemoMode } from "@/lib/api";

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes("Mac");
}

export function AppTopBar() {
  const location = useLocation();
  const { user, isDemo } = useAuthUser();
  const shortcut = isMacPlatform() ? "⌘K" : "Ctrl+K";

  let clerk: any = null;
  try {
    clerk = useClerk();
  } catch {
    // Clerk optional
  }

  const handleLogout = () => {
    setDemoMode(false);
    if (clerk?.signOut) {
      try {
        clerk.signOut();
      } catch {}
    }
    window.location.hash = "#/landing";
    window.location.reload();
  };

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
        {isDemo && (
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
            title="Click to exit demo mode and return to landing page"
          >
            <LogOut size={13} />
            Exit Demo
          </button>
        )}
        <ThemeToggle />
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2.5 pl-2 ml-1 border-l border-slate-200 dark:border-white/[0.08]">
          <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          <div className="min-w-0 hidden md:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight truncate">
              {user?.firstName || (isDemo ? "Guest User" : "You")}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isDemo ? "Demo Mode" : "Workspace"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}


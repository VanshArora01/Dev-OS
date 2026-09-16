import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { AppTopBar } from "@/components/AppTopBar";
import { ProjectTabs } from "@/components/project/ProjectTabs";
import { CommandPalette } from "@/components/CommandPalette";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function DashboardLayout() {
  const location = useLocation();
  const isProjectPage = location.pathname.startsWith("/project/");

  return (
    <div className="flex h-screen w-full bg-background text-slate-700 dark:text-zinc-300 overflow-hidden selection:bg-brand/20">
      {!isProjectPage && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isProjectPage ? <ProjectTabs /> : <AppTopBar />}

        <main
          className={`flex-1 min-h-0 ${
            location.pathname.startsWith("/assistant")
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getProjects, searchGithubCode } from "@/lib/api";
import { COMMAND_EVENT } from "@/lib/motion";
import { projectStatusTone } from "@/lib/status";
import { StatusDot } from "@/components/ui/status-dot";
import { Clock, FolderKanban, Github, LayoutDashboard, Settings, Bell, Bot, Sparkles } from "lucide-react";

const RECENT_KEY = "devos:cmd-recent";

type RecentItem = { path: string; label: string; at: number };

function loadRecent(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushRecent(item: Omit<RecentItem, "at">) {
  const next = [{ ...item, at: Date.now() }, ...loadRecent().filter((r) => r.path !== item.path)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const projectMatch = location.pathname.match(/^\/project\/([^/?#]+)/);
  const pid = projectMatch ? projectMatch[1] : null;
  const activeRepo = pid && typeof window !== "undefined" ? localStorage.getItem(`devos:gh-active:${pid}`) : null;
  const [owner, repo] = (activeRepo || "").split("/");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: () => getProjects(user?.id),
    enabled: !!user?.id && open,
  });
  const { data: githubHits } = useQuery({
    queryKey: ["gh-cmd-search", pid, activeRepo, query],
    queryFn: () => searchGithubCode(user!.id, pid!, owner, repo, query),
    enabled: open && !!user?.id && !!pid && !!owner && !!repo && query.trim().length > 2,
    staleTime: 20_000,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setRecent(loadRecent());
  }, [open]);

  const go = (path: string, label: string) => {
    pushRecent({ path, label });
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, GitHub files, Neural AI…" onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {recent.length > 0 && (
          <CommandGroup heading="Recent">
            {recent.map((r) => (
              <CommandItem key={r.path} onSelect={() => go(r.path, r.label)} className="gap-2">
                <Clock size={14} className="text-slate-400" />
                {r.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/", "Overview")} className="gap-2">
            <LayoutDashboard size={14} /> Overview
          </CommandItem>
          <CommandItem onSelect={() => go("/projects", "Projects")} className="gap-2">
            <FolderKanban size={14} /> Projects
          </CommandItem>
          <CommandItem onSelect={() => go("/reminders", "Reminders")} className="gap-2">
            <Bell size={14} /> Reminders
          </CommandItem>
          <CommandItem onSelect={() => go("/assistant", "Assistant")} className="gap-2">
            <Sparkles size={14} className="text-brand" /> Assistant
          </CommandItem>
          <CommandItem onSelect={() => go("/settings", "Settings")} className="gap-2">
            <Settings size={14} /> Settings
          </CommandItem>
          {pid && (
            <CommandItem onSelect={() => go(`/project/${pid}?tab=ai`, "Ask Neural AI")} className="gap-2">
              <Bot size={14} className="text-brand" /> Ask Neural AI
            </CommandItem>
          )}
          {pid && (
            <CommandItem onSelect={() => go(`/project/${pid}?tab=github`, "GitHub workspace")} className="gap-2">
              <Github size={14} /> GitHub workspace
            </CommandItem>
          )}
        </CommandGroup>
        {(githubHits?.items || []).length > 0 && (
          <CommandGroup heading={`GitHub · ${activeRepo}`}>
            {githubHits.items.slice(0, 8).map((item: { path: string }) => (
              <CommandItem
                key={item.path}
                value={`github ${item.path}`}
                onSelect={() => {
                  if (pid) {
                    sessionStorage.setItem(
                      `devos:gh-sel:${pid}`,
                      JSON.stringify({ path: item.path, kind: 'file' })
                    );
                  }
                  go(
                    `/project/${pid}?tab=github&ghMode=code&ghRepo=${activeRepo}`,
                    item.path
                  );
                }}
                className="gap-2"
              >
                <Github size={14} className="text-indigo-500" />
                <span className="truncate">{item.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.slice(0, 12).map((p) => (
              <CommandItem key={p._id} onSelect={() => go(`/project/${p._id}`, p.name)} className="gap-2">
                <StatusDot tone={projectStatusTone(p.status)} />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

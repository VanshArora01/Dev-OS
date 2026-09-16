import {
    BarChart3,
    Bell,
    Bot,
    CheckCircle2,
    ClipboardList,
    FileText,
    Globe,
    Layout,
    Sparkles,
    Github,
} from "lucide-react";

export const PROJECT_TABS = [
    { id: "today", label: "Overview", icon: BarChart3 },
    { id: "sessions", label: "Timeline", icon: ClipboardList },
    { id: "kanban", label: "Kanban", icon: Layout },
    { id: "brief", label: "Brief", icon: FileText },
    { id: "decisions", label: "Decisions", icon: CheckCircle2 },
    { id: "stack", label: "Stack", icon: Globe },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "github", label: "GitHub", icon: Github },
    { id: "ai", label: "Neural AI", icon: Sparkles },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]["id"];

export function parseProjectTab(value: string | null): ProjectTabId {
    const match = PROJECT_TABS.find((tab) => tab.id === value);
    return match ? match.id : "today";
}

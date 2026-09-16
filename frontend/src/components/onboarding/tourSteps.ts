export interface TourStep {
  id: string;
  target: string; // CSS selector or data-tour identifier (e.g. '[data-tour="sidebar-overview"]')
  title: string;
  description: string;
  detail?: string;
  route?: string; // Target route if navigation is required
  tabId?: string; // Query param tabId if project page navigation is required
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface TourDefinition {
  id: string;
  title: string;
  steps: TourStep[];
}

export const TOURS: Record<string, TourDefinition> = {
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard Overview',
    steps: [
      {
        id: 'dash-welcome',
        target: '[data-tour="dashboard-welcome"]',
        title: 'Welcome to DevOS',
        description: 'This is your project command center. DevOS brings your projects, development activity, connected services, and AI context together in one place.',
        detail: 'Command Center Overview',
        route: '/',
        position: 'bottom'
      },
      {
        id: 'dash-projects',
        target: '[data-tour="sidebar-projects"]',
        title: 'Your Projects',
        description: 'Access and manage all active workspaces. Every project maintains its own isolated context, tasks, and history.',
        detail: 'Project Management',
        route: '/',
        position: 'right'
      },
      {
        id: 'dash-create',
        target: '[data-tour="dashboard-create-project"]',
        title: 'Project Creation',
        description: 'Start a new project from scratch or initialize directly from a PRD document to auto-generate technical tasks and tech stack context.',
        detail: 'PRD & Task Generator',
        route: '/',
        position: 'left'
      },
      {
        id: 'dash-assistant',
        target: '[data-tour="sidebar-assistant"]',
        title: 'Neural AI Assistant',
        description: 'Ask DevOS portfolio-level questions across all your projects or execute automated capability actions.',
        detail: 'AI Command Center',
        route: '/',
        position: 'right'
      },
      {
        id: 'dash-settings',
        target: '[data-tour="sidebar-settings"]',
        title: 'Settings & Integrations',
        description: 'Connect optional third-party integrations like GitHub, Google Drive, and Gmail to feed live codebase context into DevOS.',
        detail: 'Workspace Integrations',
        route: '/',
        position: 'right'
      }
    ]
  },

  project: {
    id: 'project',
    title: 'Project Workspace Tour',
    steps: [
      {
        id: 'proj-overview',
        target: '[data-tour="project-tab-today"]',
        title: 'Project Overview',
        description: 'This is your project\'s central view. Use it to quickly understand the current state of the project, recent activity, and upcoming deadlines.',
        detail: 'Project Dashboard',
        tabId: 'today',
        position: 'bottom'
      },
      {
        id: 'proj-brief',
        target: '[data-tour="project-tab-brief"]',
        title: 'Project Brief',
        description: 'Keep the project\'s core purpose, client requirements, technical constraints, and key specifications accessible without searching separate documents.',
        detail: 'PRD & Context Summary',
        tabId: 'brief',
        position: 'bottom'
      },
      {
        id: 'proj-kanban',
        target: '[data-tour="project-tab-kanban"]',
        title: 'Project Tasks',
        description: 'Track what needs to be done, what is currently in progress, and completed milestones.',
        detail: 'Interactive Task Board',
        tabId: 'kanban',
        position: 'bottom'
      },
      {
        id: 'proj-stack',
        target: '[data-tour="project-tab-stack"]',
        title: 'Technology Context',
        description: 'Keep the project\'s frameworks, libraries, and architecture details visible in one centralized reference.',
        detail: 'Tech Stack & Architecture',
        tabId: 'stack',
        position: 'bottom'
      },
      {
        id: 'proj-sessions',
        target: '[data-tour="project-tab-sessions"]',
        title: 'Development Sessions',
        description: 'Track your development sessions, log progress, record technical decisions, and maintain flow state across days.',
        detail: 'Timeline & Progress Log',
        tabId: 'sessions',
        position: 'bottom'
      },
      {
        id: 'proj-github',
        target: '[data-tour="project-tab-github"]',
        title: 'GitHub Workspace',
        description: 'Explore your repository, view commits, pull requests, file trees, and code context directly inside DevOS.',
        detail: 'Code Repository Workspace',
        tabId: 'github',
        position: 'bottom'
      },
      {
        id: 'proj-ai',
        target: '[data-tour="project-tab-ai"]',
        title: 'Neural AI',
        description: 'Ask an AI agent about your project using live codebase knowledge, connected documents, and workspace tools.',
        detail: 'Project-Aware AI Agent',
        tabId: 'ai',
        position: 'bottom'
      }
    ]
  },

  github: {
    id: 'github',
    title: 'GitHub Integration Tour',
    steps: [
      {
        id: 'github-workspace',
        target: '[data-tour="project-tab-github"]',
        title: 'GitHub Connection Active',
        description: 'DevOS is now linked with your GitHub repository. Commit history, pull requests, and file trees are synced into Neural AI context.',
        detail: 'Live Repository Sync',
        tabId: 'github',
        position: 'bottom'
      }
    ]
  },

  google_drive: {
    id: 'google_drive',
    title: 'Google Drive Tour',
    steps: [
      {
        id: 'drive-sync',
        target: '[data-tour="settings-drive-card"]',
        title: 'Google Drive Connected',
        description: 'Google Drive is linked. Neural AI can search, inspect, and summarize docs or export generated reports directly to your Google Drive.',
        detail: 'Cloud Document Integration',
        route: '/settings',
        position: 'top'
      }
    ]
  },

  gmail: {
    id: 'gmail',
    title: 'Gmail Tour',
    steps: [
      {
        id: 'gmail-sync',
        target: '[data-tour="settings-drive-card"]',
        title: 'Gmail Sending Ready',
        description: 'Gmail sending capabilities are enabled through your connected Google OAuth account. Send email reports and project updates with AI assistance.',
        detail: 'Email Automation',
        route: '/settings',
        position: 'top'
      }
    ]
  },

  neural: {
    id: 'neural',
    title: 'Neural AI Guide',
    steps: [
      {
        id: 'neural-intro',
        target: '[data-tour="sidebar-assistant"]',
        title: 'Meet Neural',
        description: 'Neural is DevOS\'s project-aware AI agent. It uses your project brief, repository, and connected sources to help you build faster.',
        detail: 'Intelligent Development Assistant',
        route: '/assistant',
        position: 'right'
      }
    ]
  }
};

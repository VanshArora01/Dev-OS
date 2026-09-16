export interface Project {
  _id: string;
  name: string;
  slug?: string;
  type: 'personal' | 'freelance' | 'company';
  description?: string;
  status: 'active' | 'paused' | 'completed';
  userId: string;
  clerkId?: string;
  owner?: { id: string; name: string; email: string };
  stakeholders?: { name: string; role: string; email: string }[];
  deadline?: string | Date;
  client?: { name: string; contact: string; billingRate?: number; invoiceTerms?: string };

  // Freelance/Company specific
  paymentAmount?: number;
  deliverables?: string[];
  teamMembers?: { name: string; email: string }[];
  priority?: 'low' | 'medium' | 'high' | 'critical';

  // Structured Tabs
  requirements?: {
    clientRequirements?: string;
    technicalRequirements?: string;
    constraints?: string;
    deliverablesChecklist?: { item: string; done: boolean }[];
  };
  reference?: {
    uiReferences?: string[];
    githubRepos?: string[];
    figmaLinks?: string[];
    styleNotes?: string;
  };
  planning?: {
    phases?: { id: string; name: string; description?: string; order: number; objectives?: string[]; dependencies?: string[] }[];
    milestones?: {
      title: string;
      description?: string;
      dueDate?: string | Date;
      status: 'pending' | 'in-progress' | 'completed';
      phase?: string;
      phaseId?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      dependencies?: string[];
      requirementIds?: string[];
      source?: string;
      order?: number;
    }[];
  };
  reminders?: { date: string | Date; message: string; sent: boolean; source?: string; confidence?: string }[];
  unresolvedDeadlines?: { title: string; date: string; description?: string; source?: string; confidence?: string }[];
  initialization?: {
    status: 'not_started' | 'in_progress' | 'complete' | 'failed';
    stage?: string;
    stageLabel?: string;
    steps?: { stage: string; label: string; status: string }[];
    error?: string;
    validationWarnings?: string[];
    taskCount?: number;
    phaseCount?: number;
    reminderCount?: number;
    techCount?: number;
  };
  blueprint?: Record<string, unknown>;
  prdSource?: { filename: string; charCount: number; extractedAt: string | Date; preview?: string };
  currentPhase?: string;
  techStackDetails?: { name: string; category: string; source: string }[];

  repoUrl?: string;
  ciUrl?: string;
  docsUrl?: string;
  githubRepositories?: GithubLinkedRepository[];
  resources?: { _id?: string; label: string; url: string }[];
  lastWorkedAt: string | Date;
  lastSessionSummary?: string;
  nextPlannedStep?: string;
  totalMinutesWorked: number;
  decisions?: { _id?: string; title: string; reasoning: string; date: string | Date; tag: string }[];
  techStack?: string[];
  // Reporting fields used in TopNav
  id?: string;
  title?: string;
  reportStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  kimiReport?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Session {
  _id: string;
  projectId: string;
  projectName?: string;
  userId: string;
  clerkId?: string;
  summary: string;
  problems?: string;
  decisions?: string;
  nextStep: string;
  durationMinutes: number;
  startedAt?: string | Date;
  stoppedAt?: string | Date;
  createdAt: string | Date;
}

export interface ProjectSummary {
  totalSessions: number;
  totalMinutes: number;
  avgSession: number;
  lastSession: Session | null;
  healthStatus: 'active' | 'slipping' | 'inactive';
}

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  lastProject: Project | null;
  yesterdaySummary: string;
  todayPlan: string;
  deadlinesSoon: { name: string; deadline: string | Date }[];
  inactiveProjects: { name: string; lastWorkedAt: string | Date }[];
  recentSessions: (Partial<Session> & { projectName: string, projectId: string })[];
}

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  done: boolean;
  clerkId: string;
  createdAt: string | Date;
}

export interface GithubLinkedRepository {
  repositoryId: string;
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  private?: boolean;
  defaultBranch?: string;
  htmlUrl?: string;
  language?: string;
  connectedAt?: string | Date;
}

export interface GithubContextScope {
  owner: string;
  repo: string;
  path?: string;
  branch?: string;
  type?: 'file' | 'folder' | 'repo';
}

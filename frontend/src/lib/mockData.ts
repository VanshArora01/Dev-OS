import type { Project, Session, DashboardSummary, Task, ProjectSummary } from "./types";
import type { ChatMessage, Conversation } from "./api";

export const MOCK_PROJECTS: Project[] = [
  {
    _id: "demo-proj-1",
    clerkId: "demo-user",
    name: "DevOS Engine Core",
    type: "company",
    description: "High-performance TypeScript orchestration runtime for multi-agent LLM workflows and contextual developer session tracking.",
    status: "active",
    deadline: "2026-11-15T00:00:00.000Z",
    suggested_tasks: [
      "Implement vector memory buffer compression for long sessions",
      "Add retry handler for rate-limited Groq API calls",
      "Benchmark token latency across Qdrant vector queries"
    ],
    resources: [
      { _id: "res-1", label: "Architecture Spec", url: "https://docs.devos.internal/spec" },
      { _id: "res-2", label: "Qdrant Schema", url: "https://cloud.qdrant.io/collections/devos" }
    ],
    initialization: {
      status: "completed",
      stage: "completed",
      unresolvedDeadlinesCount: 0,
      tasksCreated: 8,
      phasesCreated: 3,
      remindersCreated: 2,
      techStackItems: 6,
      deliverablesCount: 4,
      initializedAt: "2026-09-01T10:00:00.000Z"
    },
    unresolvedDeadlines: [],
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-15T14:30:00.000Z"
  },
  {
    _id: "demo-proj-2",
    clerkId: "demo-user",
    name: "PayFlow Stripe Gateway",
    type: "freelance",
    description: "PCI-compliant subscription and webhook settlement microservice with automated fraud scoring and multi-currency billing.",
    status: "active",
    deadline: "2026-10-01T00:00:00.000Z",
    suggested_tasks: [
      "Verify Stripe webhook signature validation on raw payload",
      "Setup idempotent database retries for failed charge events",
      "Configure dbt reporting pipeline for monthly ARR breakdown"
    ],
    resources: [
      { _id: "res-3", label: "Stripe API Portal", url: "https://dashboard.stripe.com/test" }
    ],
    initialization: {
      status: "completed",
      stage: "completed",
      unresolvedDeadlinesCount: 0,
      tasksCreated: 5,
      phasesCreated: 2,
      remindersCreated: 1,
      techStackItems: 4,
      deliverablesCount: 3,
      initializedAt: "2026-09-05T12:00:00.000Z"
    },
    unresolvedDeadlines: [],
    createdAt: "2026-09-05T12:00:00.000Z",
    updatedAt: "2026-09-14T09:15:00.000Z"
  },
  {
    _id: "demo-proj-3",
    clerkId: "demo-user",
    name: "Neural Knowledge RAG Pipeline",
    type: "personal",
    description: "Asynchronous document indexing system utilizing Gemini embeddings and Qdrant vector storage for real-time code context retrieval.",
    status: "active",
    deadline: "2026-12-01T00:00:00.000Z",
    suggested_tasks: [
      "Tune HNSW index parameters for sub-50ms vector search",
      "Add PDF/Markdown hybrid chunker with AST header splitting"
    ],
    resources: [],
    initialization: {
      status: "completed",
      stage: "completed",
      unresolvedDeadlinesCount: 0,
      tasksCreated: 4,
      phasesCreated: 2,
      remindersCreated: 1,
      techStackItems: 5,
      deliverablesCount: 2,
      initializedAt: "2026-09-10T16:00:00.000Z"
    },
    unresolvedDeadlines: [],
    createdAt: "2026-09-10T16:00:00.000Z",
    updatedAt: "2026-09-16T18:00:00.000Z"
  }
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  activeProjectsCount: 3,
  completedProjectsCount: 5,
  totalSessionsCount: 42,
  totalVelocityMinutes: 1840,
  recentProjects: MOCK_PROJECTS,
  recentSessions: [
    {
      _id: "sess-1",
      projectId: "demo-proj-1",
      clerkId: "demo-user",
      durationMinutes: 45,
      summary: "Implemented Groq tool-calling recovery pipeline and added fallback JSON parser for malformed model outputs.",
      nextSteps: "Add unit tests for tool recovery edge cases and verify Qdrant embedding filters.",
      createdAt: "2026-09-16T14:00:00.000Z"
    },
    {
      _id: "sess-2",
      projectId: "demo-proj-2",
      clerkId: "demo-user",
      durationMinutes: 60,
      summary: "Integrated webhook signature validation for Stripe events and updated Mongoose UserSubscription schema.",
      nextSteps: "Run sandbox test suite for failed card renewal callbacks.",
      createdAt: "2026-09-15T11:30:00.000Z"
    }
  ],
  upcomingReminders: [
    {
      _id: "rem-1",
      title: "Review Qdrant Vector Index Performance",
      dueDate: "2026-09-20T10:00:00.000Z",
      priority: "high"
    },
    {
      _id: "rem-2",
      title: "Audit Integration Encryption Keys",
      dueDate: "2026-09-22T15:00:00.000Z",
      priority: "medium"
    }
  ]
};

export const MOCK_TASKS: Task[] = [
  {
    _id: "task-101",
    projectId: "demo-proj-1",
    clerkId: "demo-user",
    title: "Configure Qdrant vector payload index for project scoping",
    done: true,
    createdAt: "2026-09-02T10:00:00.000Z"
  },
  {
    _id: "task-102",
    projectId: "demo-proj-1",
    clerkId: "demo-user",
    title: "Implement Groq tool recovery middleware for malformed JSON calls",
    done: true,
    createdAt: "2026-09-05T14:00:00.000Z"
  },
  {
    _id: "task-103",
    projectId: "demo-proj-1",
    clerkId: "demo-user",
    title: "Benchmark multi-turn context reconstruction latency under 100ms",
    done: false,
    createdAt: "2026-09-10T11:00:00.000Z"
  },
  {
    _id: "task-104",
    projectId: "demo-proj-1",
    clerkId: "demo-user",
    title: "Write integration tests for GitHub PR summary tool executor",
    done: false,
    createdAt: "2026-09-14T16:00:00.000Z"
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    _id: "conv-demo-1",
    title: "DevOS Context Memory & Tool Execution Spec",
    summary: "Discussion on multi-agent tool execution and Qdrant RAG vector retrieval setup.",
    messageCount: 3,
    lastMessageAt: "2026-09-16T15:30:00.000Z",
    createdAt: "2026-09-16T15:00:00.000Z",
    updatedAt: "2026-09-16T15:30:00.000Z"
  }
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    _id: "msg-1",
    role: "user",
    content: "Summarize our tech stack and check recent GitHub pull requests for any open security risks.",
    createdAt: "2026-09-16T15:01:00.000Z"
  },
  {
    _id: "msg-2",
    role: "assistant",
    content: "Here is the summary of the **DevOS Engine Core** tech stack and recent PR security audit:\n\n### Tech Stack Architecture\n- **Runtime**: Node.js v20 / CommonJS Backend + Vite 5 React frontend\n- **AI Orchestration**: Groq LLaMA 3 70B & Gemini 1.5 Pro via intent router\n- **Vector Storage**: Qdrant Cloud (384-dim HNSW embeddings)\n- **Database**: MongoDB Atlas with Mongoose schema validation\n- **Auth**: Clerk JWT verification\n\n### GitHub Audit Result\nI queried recent open PRs on repository `VanshArora01/Dev-OS` using the `github_list_pull_requests` tool. No critical security vulnerabilities were detected in the active pull requests.",
    sources: [
      { title: "README.md", path: "README.md", sourceType: "github" },
      { title: "qdrantService.js", path: "backend/services/qdrantService.js", sourceType: "code" }
    ],
    toolActivity: [
      { toolName: "search_project_knowledge", label: "Searched vector database for tech stack", success: true },
      { toolName: "github_list_pull_requests", label: "Audited GitHub open pull requests", success: true }
    ],
    metadata: {
      action_taken: "Searched project RAG knowledge base and audited GitHub PRs."
    },
    createdAt: "2026-09-16T15:01:05.000Z"
  }
];

export const MOCK_SAMPLE_PRD_TEXT = `# Product Requirement Document: DevOS Contextual Assistant

## Overview
DevOS requires a low-latency, contextual developer assistant capable of ingesting PRD documents, extracting actionable task breakdowns, building vector RAG indexes, and executing developer tools with Human-In-The-Loop approval gates.

## Requirements
1. **PRD Parsing**: Parse uploaded PDF, DOCX, or raw text PRDs to extract project scope, tech stack requirements, key phases, and risk logs.
2. **Vector Indexing**: Chunk document sections into 512-token passages and upload embeddings to Qdrant.
3. **Agentic Tool Execution**: Support GitHub code inspection, document generation (PDF/DOCX), email dispatch, and Google Drive syncing.
4. **Security & Privacy**: Encrypt user tokens at rest using AES-256 and mandate explicit user approval for destructive actions.
`;

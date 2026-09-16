import type { Project, Session, DashboardSummary, Task, ProjectSummary } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL environment variable is missing.");
}

let getAuthToken: (() => Promise<string | null>) | null = null;
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => { getAuthToken = getter; };

export async function fetchWithAuth(url: string | URL, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  let token: string | null = null;
  console.log(`[DevOS API] fetchWithAuth called for URL:`, url);

  // Poll for token up to 5 seconds (100 * 50ms) during app startup
  for (let i = 0; i < 100; i++) {
    try {
      if (getAuthToken) {
        token = await getAuthToken();
      } else if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
        token = await (window as any).Clerk.session.getToken();
      }
    } catch (err) {
      console.error('[DevOS API] Error fetching token:', err);
    }
    
    if (token) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log(`[DevOS API] Authorization header set.`);
  } else {
    console.warn('[DevOS API] Proceeding without Authorization header (token unavailable). getAuthToken was:', !!getAuthToken);
  }
  
  return fetch(url, { ...options, headers });
}

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error) return data.error;
    if (typeof data?.message === "string" && data.message) return data.message;
  } catch {
    /* non-JSON error body */
  }
  return `${fallback} (${response.status})`;
}

export async function getProjects(clerkId?: string): Promise<Project[]> {
  const url = clerkId ? `${API_BASE_URL}/projects?clerkId=${encodeURIComponent(clerkId)}` : `${API_BASE_URL}/projects`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to fetch projects'));
  return response.json();
}

export async function getProjectById(id: string, clerkId?: string): Promise<Project> {
  const url = clerkId ? `${API_BASE_URL}/projects/${id}?clerkId=${encodeURIComponent(clerkId)}` : `${API_BASE_URL}/projects/${id}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to fetch project');
  return response.json();
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const response = await fetchWithAuth(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create project');
  }
  return response.json();
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to update project'));
  }
  return response.json();
}

export async function deleteProject(id: string, clerkId: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}?clerkId=${encodeURIComponent(clerkId)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete project');
  }
  return response.json();
}

export async function getDashboardSummary(clerkId: string): Promise<DashboardSummary> {
  const url = `${API_BASE_URL}/dashboard/summary?clerkId=${encodeURIComponent(clerkId)}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to fetch dashboard summary'));
  return response.json();
}

export async function getSessions(projectId: string, clerkId: string): Promise<Session[]> {
  const url = `${API_BASE_URL}/sessions/${projectId}?clerkId=${encodeURIComponent(clerkId)}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

export async function getLastSession(projectId: string, clerkId: string): Promise<Session | null> {
  const url = `${API_BASE_URL}/sessions/last/${projectId}`;
  const response = await fetchWithAuth(url, {
    headers: {
      'x-clerk-id': clerkId
    }
  });
  if (!response.ok) throw new Error('Failed to fetch last session');
  return response.json();
}


export async function createSession(sessionData: Partial<Session> & { clerkId: string }): Promise<Session> {
  const response = await fetchWithAuth(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Failed to create session'));
  }
  return response.json();
}

export async function getProjectSummary(id: string, clerkId: string): Promise<ProjectSummary> {
  const url = `${API_BASE_URL}/projects/${id}/summary?clerkId=${encodeURIComponent(clerkId)}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to fetch project summary');
  return response.json();
}

export async function getTasks(projectId: string, clerkId: string): Promise<Task[]> {
  const url = `${API_BASE_URL}/tasks/${projectId}?clerkId=${encodeURIComponent(clerkId)}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTask(taskData: { projectId: string; title: string; clerkId: string }): Promise<Task> {
  const response = await fetchWithAuth(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create task');
  }
  return response.json();
}

export async function updateTask(id: string, taskData: { done: boolean }): Promise<Task> {
  const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update task');
  }
  return response.json();
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete task');
  }
  return response.json();
}

export async function addResource(id: string, label: string, url: string): Promise<Project> {
  const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}/resource`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, url })
  });
  if (!response.ok) throw new Error('Failed to add resource');
  return response.json();
}

export async function deleteResource(id: string, rid: string): Promise<Project> {
  const response = await fetchWithAuth(`${API_BASE_URL}/projects/${id}/resource/${rid}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete resource');
  return response.json();
}

export type AIChatScope = 'persistent' | 'ephemeral';
export type AIChatSurface = 'project' | 'workspace';

export async function aiChat(
  projectId: string | null | undefined,
  content: string,
  clerkId: string,
  conversationId?: string,
  githubContext?: Record<string, unknown> | object,
  options?: { scope?: AIChatScope; surface?: AIChatSurface }
): Promise<{
  conversationId: string;
  reply: string;
  message?: ChatMessage;
  userMessage?: ChatMessage;
  action_taken?: string;
  action_result?: any;
  pending_action?: {
    id: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    description: string;
    requires_approval: boolean;
  };
  sources?: {
    title: string;
    url?: string;
    fileId?: string;
    sourceType?: string;
    path?: string;
    commitSha?: string;
  }[];
  action_cards?: Array<{
    type: 'download' | 'drive' | 'email';
    label: string;
    file_name?: string;
    download_url?: string;
    url?: string;
    success?: boolean;
  }>;
  current_artifact?: Record<string, unknown>;
  tool_activity?: { toolName: string; success: boolean }[];
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({
      projectId: options?.surface === 'workspace' ? undefined : projectId,
      content,
      conversationId,
      githubContext,
      scope: options?.scope,
      surface: options?.surface
    })
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, 'AI request failed'));
  }
  return response.json();
}

export interface Conversation {
  _id: string;
  title: string;
  summary?: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    title: string;
    url?: string;
    fileId?: string;
    sourceType?: string;
    path?: string;
    commitSha?: string;
  }[];
  toolActivity?: { toolName: string; label?: string; success: boolean }[];
    metadata?: {
    pending_action?: {
      id: string;
      toolName: string;
      toolArgs: Record<string, unknown>;
      description: string;
      requires_approval: boolean;
    };
    action_taken?: string;
    actions_taken?: string[];
    action_cards?: Array<{
      type: 'download' | 'drive' | 'email';
      label: string;
      file_name?: string;
      download_url?: string;
      url?: string;
      success?: boolean;
    }>;
  };
  createdAt?: string;
}

export async function listAIConversations(
  projectId: string | null | undefined,
  clerkId: string,
  surface: AIChatSurface = 'project'
): Promise<Conversation[]> {
  const params = new URLSearchParams();
  if (surface === 'workspace') params.set('surface', 'workspace');
  else if (projectId) params.set('projectId', projectId);
  const response = await fetchWithAuth(
    `${API_BASE_URL}/ai/conversations?${params.toString()}`,
    { headers: { 'x-clerk-id': clerkId } }
  );
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to load conversations'));
  const data = await response.json();
  return data.conversations;
}

export async function createAIConversation(
  projectId: string | null | undefined,
  clerkId: string,
  title?: string,
  options?: { scope?: AIChatScope; surface?: AIChatSurface }
): Promise<Conversation> {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({
      projectId: options?.surface === 'workspace' ? undefined : projectId,
      title,
      scope: options?.scope,
      surface: options?.surface
    })
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to create conversation'));
  const data = await response.json();
  return data.conversation;
}

export async function updateAIConversation(
  conversationId: string,
  projectId: string | null | undefined,
  clerkId: string,
  title: string,
  surface: AIChatSurface = 'project'
): Promise<Conversation> {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({ projectId, title, surface })
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to update conversation'));
  const data = await response.json();
  return data.conversation;
}

export async function deleteAIConversation(
  conversationId: string,
  projectId: string | null | undefined,
  clerkId: string,
  surface: AIChatSurface = 'project'
): Promise<void> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);
  params.set('surface', surface);
  const response = await fetchWithAuth(
    `${API_BASE_URL}/ai/conversations/${conversationId}?${params.toString()}`,
    {
      method: 'DELETE',
      headers: { 'x-clerk-id': clerkId }
    }
  );
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to delete conversation'));
}

export async function getAIConversationMessages(
  conversationId: string,
  projectId: string | null | undefined,
  clerkId: string,
  surface: AIChatSurface = 'project'
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);
  params.set('surface', surface);
  const response = await fetchWithAuth(
    `${API_BASE_URL}/ai/conversations/${conversationId}/messages?${params.toString()}`,
    { headers: { 'x-clerk-id': clerkId } }
  );
  if (!response.ok) throw new Error(await readApiError(response, 'Failed to load messages'));
  const data = await response.json();
  return data.messages;
}

export async function sendAIConversationMessage(
  conversationId: string,
  projectId: string,
  content: string,
  clerkId: string
) {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({ projectId, content })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'AI request failed');
  }
  return response.json();
}

export async function approveAIAction(projectId: string, approvalId: string, clerkId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/approve-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({ projectId, approvalId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to approve action');
  }
  return response.json() as Promise<{
    success: boolean;
    reply: string;
    conversationId?: string;
    message?: ChatMessage;
    action_taken?: string;
    action_result?: any;
    sources?: {
    title: string;
    url?: string;
    fileId?: string;
    sourceType?: string;
    path?: string;
    commitSha?: string;
  }[];
    tool_activity?: { toolName: string; success: boolean }[];
    action_cards?: ChatMessage['metadata'] extends { action_cards?: infer A } ? A : never;
    current_artifact?: { artifact_id: string; filename: string; format: string };
    pending_action?: ChatMessage['metadata'] extends { pending_action?: infer P } ? P : never;
  }>;
}

export async function rejectAIAction(projectId: string, approvalId: string, clerkId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/ai/reject-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({ projectId, approvalId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to reject action');
  }
  return response.json() as Promise<{
    success: boolean;
    reply: string;
    conversationId?: string;
    message?: ChatMessage;
    action_taken?: string;
    action_result?: any;
    sources?: {
    title: string;
    url?: string;
    fileId?: string;
    sourceType?: string;
    path?: string;
    commitSha?: string;
  }[];
    tool_activity?: { toolName: string; success: boolean }[];
    action_cards?: ChatMessage['metadata'] extends { action_cards?: infer A } ? A : never;
    current_artifact?: { artifact_id: string; filename: string; format: string };
    pending_action?: ChatMessage['metadata'] extends { pending_action?: infer P } ? P : never;
  }>;
}

export async function getGoogleDriveStatus(clerkId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/integrations/google/status?clerkId=${encodeURIComponent(clerkId)}`, {
    headers: { 'x-clerk-id': clerkId }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch Google Drive status');
  }
  return response.json();
}

export async function getGoogleDriveConnectUrl(clerkId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/integrations/google/connect-url?clerkId=${encodeURIComponent(clerkId)}`, {
    headers: { 'x-clerk-id': clerkId }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get Google Drive connect URL');
  }
  return response.json();
}

export async function disconnectGoogleDrive(clerkId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/integrations/google/disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId
    },
    body: JSON.stringify({ clerkId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to disconnect Google Drive');
  }
  return response.json();
}

export const analyzeSession = async (data: {
  images: { base64: string; mimeType: string }[];
  duration: number;
  projectContext: {
    name: string;
    type: string;
    description: string;
    lastNextStep: string;
  };
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/sessions/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze session');
  }
  return response.json();
};

export const parsePRD = async (file: File): Promise<{
    name: string;
    type: "personal" | "freelance" | "company";
    description: string;
    deadline: string | null;
    suggested_tasks: string[];
}> => {
    const formData = new FormData();
    formData.append('prd', file);

    const response = await fetchWithAuth(`${API_BASE_URL}/projects/parse-prd`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse PRD');
    }
    return response.json();
};

export async function extractPRDText(file?: File, text?: string): Promise<{
    success: boolean;
    text: string;
    filename: string;
    charCount: number;
}> {
    if (file) {
        const formData = new FormData();
        formData.append('prd', file);
        const response = await fetchWithAuth(`${API_BASE_URL}/projects/extract-prd`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to extract PRD text');
        }
        return response.json();
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/projects/extract-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to extract PRD text');
    }
    return response.json();
}

export async function initializeProject(
    projectId: string,
    clerkId: string,
    options: { text?: string; file?: File; force?: boolean }
): Promise<{
    success: boolean;
    started?: boolean;
    inProgress?: boolean;
    stage?: string;
    project?: Project;
    summary?: {
        tasksCreated: number;
        phasesCreated: number;
        remindersCreated: number;
        techStackItems: number;
        deliverables: number;
        validationWarnings: string[];
    };
    alreadyInitialized?: boolean;
    message?: string;
}> {
    const formData = new FormData();
    formData.append('clerkId', clerkId);
    if (options.file) {
        formData.append('prd', options.file);
    }
    if (options.text) {
        formData.append('text', options.text);
    }
    if (options.force) {
        formData.append('force', 'true');
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/initialize`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!response.ok && response.status !== 202) {
        throw new Error(data.error || 'Project initialization failed');
    }
    return data;
}

export async function getInitializationStatus(
    projectId: string,
    clerkId: string
): Promise<{
    initialization: Project['initialization'];
    unresolvedDeadlines: Project['unresolvedDeadlines'];
}> {
    const url = `${API_BASE_URL}/projects/${projectId}/initialization-status?clerkId=${encodeURIComponent(clerkId)}`;
    const response = await fetchWithAuth(url);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get initialization status');
    }
    return response.json();
}

async function githubFetch(path: string, clerkId: string, init?: RequestInit) {
  const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-id': clerkId,
      ...(init?.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'GitHub request failed');
  }
  return data;
}

export async function getGithubStatus(clerkId: string) {
  return githubFetch(`/integrations/github/status?clerkId=${encodeURIComponent(clerkId)}`, clerkId);
}

export async function getGithubConnectUrl(clerkId: string) {
  return githubFetch(`/integrations/github/connect-url?clerkId=${encodeURIComponent(clerkId)}`, clerkId) as Promise<{
    connectUrl: string;
    installUrl?: string;
  }>;
}

export async function disconnectGithub(clerkId: string) {
  return githubFetch('/integrations/github/disconnect', clerkId, {
    method: 'POST',
    body: JSON.stringify({ clerkId })
  });
}

export async function listGithubRepositories(clerkId: string, search = '', refresh = false) {
  const params = new URLSearchParams({ clerkId });
  if (search) params.set('search', search);
  if (refresh) params.set('refresh', '1');
  return githubFetch(`/integrations/github/repositories?${params}`, clerkId);
}

export async function listProjectGithubRepositories(projectId: string, clerkId: string) {
  return githubFetch(`/integrations/github/projects/${projectId}/repositories?clerkId=${encodeURIComponent(clerkId)}`, clerkId);
}

export async function connectProjectGithubRepository(projectId: string, clerkId: string, owner: string, repo: string) {
  return githubFetch(`/integrations/github/projects/${projectId}/repositories`, clerkId, {
    method: 'POST',
    body: JSON.stringify({ owner, repo, clerkId })
  });
}

export async function disconnectProjectGithubRepository(projectId: string, clerkId: string, owner: string, repo: string) {
  return githubFetch(
    `/integrations/github/projects/${projectId}/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    clerkId,
    { method: 'DELETE', body: JSON.stringify({ clerkId }) }
  );
}

function repoQuery(clerkId: string, projectId: string, extra: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ clerkId, projectId });
  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function getGithubTree(clerkId: string, projectId: string, owner: string, repo: string, path = '', refresh = false) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/tree?${repoQuery(clerkId, projectId, { path, refresh: refresh ? '1' : undefined })}`,
    clerkId
  );
}

export async function getGithubFile(clerkId: string, projectId: string, owner: string, repo: string, path: string, ref?: string) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/file?${repoQuery(clerkId, projectId, { path, ref })}`,
    clerkId
  );
}

export async function getGithubCommits(clerkId: string, projectId: string, owner: string, repo: string, extra: Record<string, string | undefined> = {}) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/commits?${repoQuery(clerkId, projectId, extra)}`,
    clerkId
  );
}

export async function getGithubCommit(clerkId: string, projectId: string, owner: string, repo: string, sha: string) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/commits/${sha}?${repoQuery(clerkId, projectId)}`,
    clerkId
  );
}

export async function getGithubPulls(clerkId: string, projectId: string, owner: string, repo: string, state = 'all') {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/pulls?${repoQuery(clerkId, projectId, { state })}`,
    clerkId
  );
}

export async function getGithubPull(clerkId: string, projectId: string, owner: string, repo: string, number: number) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/pulls/${number}?${repoQuery(clerkId, projectId)}`,
    clerkId
  );
}

export async function getGithubBranches(clerkId: string, projectId: string, owner: string, repo: string) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/branches?${repoQuery(clerkId, projectId)}`,
    clerkId
  );
}

export async function getGithubIssues(clerkId: string, projectId: string, owner: string, repo: string, state = 'open') {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/issues?${repoQuery(clerkId, projectId, { state })}`,
    clerkId
  );
}

export async function refreshGithubRepository(clerkId: string, owner: string, repo: string) {
  return githubFetch(`/integrations/github/repositories/${owner}/${repo}/refresh`, clerkId, {
    method: 'POST',
    body: JSON.stringify({ clerkId })
  });
}

export async function getGithubRepository(clerkId: string, owner: string, repo: string) {
  return githubFetch(`/integrations/github/repositories/${owner}/${repo}?clerkId=${encodeURIComponent(clerkId)}`, clerkId);
}

export async function getGithubRelationships(
  clerkId: string,
  projectId: string,
  owner: string,
  repo: string,
  path: string
) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/relationships?${repoQuery(clerkId, projectId, { path })}`,
    clerkId
  );
}

export async function searchGithubCode(clerkId: string, projectId: string, owner: string, repo: string, q: string) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/search?${repoQuery(clerkId, projectId, { q })}`,
    clerkId
  );
}

export async function indexGithubRepository(clerkId: string, projectId: string, owner: string, repo: string) {
  return githubFetch(`/integrations/github/repositories/${owner}/${repo}/index`, clerkId, {
    method: 'POST',
    body: JSON.stringify({ clerkId, projectId })
  });
}

export async function getGithubIndexStatus(clerkId: string, projectId: string, owner: string, repo: string) {
  return githubFetch(
    `/integrations/github/repositories/${owner}/${repo}/index?${repoQuery(clerkId, projectId)}`,
    clerkId
  );
}


import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthUser } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import {
    aiChat,
    approveAIAction,
    rejectAIAction,
    listAIConversations,
    createAIConversation,
    updateAIConversation,
    deleteAIConversation,
    getAIConversationMessages,
    type Conversation,
    type ChatMessage
} from '@/lib/api';

export type { ChatMessage, Conversation };

const TOOL_LABELS: Record<string, string> = {
    drive_search: 'Searched Google Drive',
    drive_list_files: 'Listed Drive files',
    drive_get_file: 'Retrieved file metadata',
    drive_read_file: 'Read document',
    drive_download_file: 'Downloaded file',
    drive_create_file: 'Created file',
    drive_upload_file: 'Uploaded file',
    drive_update_file: 'Updated file',
    drive_rename_file: 'Renamed file',
    drive_move_file: 'Moved file',
    drive_delete_file: 'Deleted file',
    drive_create_folder: 'Created folder',
    search_project_knowledge: 'Retrieved project context',
    create_reminder: 'Created reminder',
    mark_milestone_done: 'Marked milestone complete',
    log_work_session: 'Logged work session',
    send_standup_email: 'Sent standup email',
    send_document_email: 'Sent document email',
    generate_docx: 'Generated Word document',
    generate_pdf: 'Generated PDF document',
    github_list_repositories: 'Listed GitHub repositories',
    github_get_repository: 'Retrieved repository metadata',
    github_list_files: 'Listed repository files',
    github_get_file: 'Read source file',
    github_get_file_history: 'Retrieved file history',
    github_list_commits: 'Listed commits',
    github_get_commit: 'Retrieved commit',
    github_list_pull_requests: 'Listed pull requests',
    github_get_pull_request: 'Retrieved pull request',
    github_list_branches: 'Listed branches',
    github_list_issues: 'Listed issues',
    github_search_code: 'Searched repository code'
};

function enrichMessage(msg: ChatMessage): ChatMessage {
    const toolActivity = (msg.toolActivity || []).map((t) => ({
        ...t,
        label: t.label || TOOL_LABELS[t.toolName] || t.toolName.replace(/_/g, ' ')
    }));
    return { ...msg, toolActivity };
}

function mapApiMessage(msg: ChatMessage): ChatMessage {
    return enrichMessage({
        _id: msg._id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources,
        toolActivity: msg.toolActivity,
        metadata: msg.metadata,
        createdAt: msg.createdAt
    });
}

function mapHitlResponseMessage(
    response: {
        message?: ChatMessage;
        reply: string;
        sources?: ChatMessage['sources'];
        tool_activity?: { toolName: string; success: boolean }[];
        action_taken?: string;
        action_cards?: ChatMessage['metadata'] extends { action_cards?: infer A } ? A : unknown;
        pending_action?: ChatMessage['metadata'] extends { pending_action?: infer P } ? P : unknown;
    }
): ChatMessage {
    if (response.message) {
        return mapApiMessage(response.message);
    }
    return mapApiMessage({
        role: 'assistant',
        content: response.reply,
        sources: response.sources,
        toolActivity: response.tool_activity?.map((t) => ({
            toolName: t.toolName,
            label: TOOL_LABELS[t.toolName],
            success: t.success
        })),
        metadata: {
            action_taken: response.action_taken,
            action_cards: response.action_cards,
            pending_action: response.pending_action
        }
    });
}

function clearResolvedPendingAction(messages: ChatMessage[], approvalId: string): ChatMessage[] {
    return messages.map((m) => {
        if (m.metadata?.pending_action?.id === approvalId) {
            const { pending_action: _removed, ...restMeta } = m.metadata;
            return { ...m, metadata: restMeta };
        }
        return m;
    });
}

export type AIChatPersistence = 'persistent' | 'ephemeral';
export type AIChatSurface = 'project' | 'workspace';

export function useAIChat(
    projectId: string | null | undefined,
    options: {
        activeConversationId?: string | null;
        githubContext?: Record<string, unknown> | {
            owner?: string;
            repo?: string;
            path?: string;
            branch?: string;
            type?: string;
        } | null;
        persistence?: AIChatPersistence;
        surface?: AIChatSurface;
        sessionKey?: string;
    } = {}
) {
    const {
        activeConversationId,
        githubContext,
        persistence = 'persistent',
        surface = 'project',
        sessionKey,
    } = options;
    const { user } = useAuthUser();
    const queryClient = useQueryClient();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(activeConversationId || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activitySteps, setActivitySteps] = useState<{ label: string; success: boolean; status: 'done' | 'active' }[]>([]);
    const loadingConvRef = useRef<string | null>(null);
    const ephemeral = persistence === 'ephemeral';

    const loadConversations = useCallback(async () => {
        if (!user || ephemeral) return;
        if (surface === 'project' && !projectId) return;
        setIsLoadingConversations(true);
        try {
            const list = await listAIConversations(projectId, user.id, surface);
            setConversations(list);
        } catch (err: any) {
            setError(err.message || 'Failed to load conversations');
        } finally {
            setIsLoadingConversations(false);
        }
    }, [projectId, user, ephemeral, surface]);

    const loadMessages = useCallback(async (conversationId: string) => {
        if (!user || ephemeral) return;
        if (surface === 'project' && !projectId) return;
        loadingConvRef.current = conversationId;
        setIsLoadingMessages(true);
        try {
            const msgs = await getAIConversationMessages(conversationId, projectId, user.id, surface);
            if (loadingConvRef.current === conversationId) {
                setMessages(msgs.map(mapApiMessage));
            }
        } catch (err: any) {
            if (loadingConvRef.current === conversationId) {
                setError(err.message || 'Failed to load messages');
            }
        } finally {
            if (loadingConvRef.current === conversationId) {
                setIsLoadingMessages(false);
            }
        }
    }, [projectId, user, ephemeral, surface]);

    useEffect(() => {
        if (ephemeral) return;
        loadConversations();
    }, [loadConversations, ephemeral]);

    useEffect(() => {
        if (ephemeral) return;
        if (activeConversationId) {
            setActiveId(activeConversationId);
        }
    }, [activeConversationId, ephemeral]);

    useEffect(() => {
        if (ephemeral) return;
        if (!activeConversationId && !activeId && conversations.length > 0 && !isLoadingConversations) {
            const latest = conversations[0];
            setActiveId(latest._id);
        }
    }, [conversations, activeConversationId, activeId, isLoadingConversations, ephemeral]);

    useEffect(() => {
        if (ephemeral) return;
        if (activeId) {
            loadMessages(activeId);
        } else {
            setMessages([]);
        }
    }, [activeId, loadMessages, ephemeral]);

    useEffect(() => {
        if (!ephemeral) return;
        setActiveId(null);
        setMessages([]);
        setError(null);
        setActivitySteps([]);
        setConversations([]);
    }, [sessionKey, ephemeral]);

    const selectConversation = useCallback((conversationId: string | null) => {
        setActiveId(conversationId);
        setError(null);
        setActivitySteps([]);
    }, []);

    const createConversation = useCallback(async () => {
        if (!user || ephemeral) return null;
        if (surface === 'project' && !projectId) return null;
        setError(null);
        try {
            const conversation = await createAIConversation(projectId, user.id, undefined, { surface, scope: 'persistent' });
            setConversations((prev) => [conversation, ...prev]);
            setActiveId(conversation._id);
            setMessages([]);
            return conversation._id;
        } catch (err: any) {
            setError(err.message || 'Failed to create conversation');
            return null;
        }
    }, [projectId, user, ephemeral, surface]);

    const renameConversation = useCallback(async (conversationId: string, title: string) => {
        if (!user) return;
        if (surface === 'project' && !projectId) return;
        try {
            const updated = await updateAIConversation(conversationId, projectId, user.id, title, surface);
            setConversations((prev) =>
                prev.map((c) => (c._id === conversationId ? { ...c, title: updated.title } : c))
            );
        } catch (err: any) {
            setError(err.message || 'Failed to rename conversation');
        }
    }, [projectId, user, surface]);

    const removeConversation = useCallback(async (conversationId: string) => {
        if (!user) return;
        if (surface === 'project' && !projectId) return;
        try {
            await deleteAIConversation(conversationId, projectId, user.id, surface);
            setConversations((prev) => prev.filter((c) => c._id !== conversationId));
            if (activeId === conversationId) {
                setActiveId(null);
                setMessages([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete conversation');
        }
    }, [projectId, user, activeId, surface]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !user) return;
        if (surface === 'project' && !projectId) return;

        setIsLoading(true);
        setError(null);
        setActivitySteps([{ label: 'Processing request', success: true, status: 'active' }]);

        let conversationId = activeId;

        const optimisticUser: ChatMessage = { role: 'user', content: content.trim() };
        setMessages((prev) => [...prev, optimisticUser]);

        try {
            const response = await aiChat(
                projectId,
                content.trim(),
                user.id,
                conversationId || undefined,
                githubContext || undefined,
                { scope: persistence, surface }
            );

            if (!conversationId) {
                conversationId = response.conversationId;
                setActiveId(conversationId);
                if (!ephemeral) await loadConversations();
            } else if (!ephemeral) {
                setConversations((prev) =>
                    prev.map((c) =>
                        c._id === conversationId
                            ? { ...c, lastMessageAt: new Date().toISOString(), messageCount: c.messageCount + 2 }
                            : c
                    ).sort((a, b) => {
                        const aTime = a.lastMessageAt || a.updatedAt;
                        const bTime = b.lastMessageAt || b.updatedAt;
                        return new Date(bTime).getTime() - new Date(aTime).getTime();
                    })
                );
            }

            const toolSteps = (response.tool_activity || []).map((t, i, arr) => ({
                label: TOOL_LABELS[t.toolName] || t.toolName.replace(/_/g, ' '),
                success: t.success,
                status: i === arr.length - 1 ? 'active' as const : 'done' as const
            }));
            setActivitySteps(toolSteps.map((s) => ({ ...s, status: 'done' as const })));

            const assistantMessage = mapApiMessage({
                _id: response.message?._id,
                role: 'assistant',
                content: response.reply,
                sources: response.sources,
                toolActivity: response.tool_activity?.map((t) => ({
                    toolName: t.toolName,
                    label: TOOL_LABELS[t.toolName],
                    success: t.success
                })),
                metadata: {
                    pending_action: response.pending_action,
                    action_taken: response.action_taken,
                    actions_taken: response.action_result?.tools_used,
                    action_cards: response.action_cards
                },
                createdAt: response.message?.createdAt
            });

            setMessages((prev) => {
                const withoutOptimistic = prev.slice(0, -1);
                const userMsg = response.userMessage
                    ? mapApiMessage(response.userMessage)
                    : optimisticUser;
                return [...withoutOptimistic, userMsg, assistantMessage];
            });

            if (response.action_taken === 'log_work_session' || response.action_taken === 'mark_milestone_done') {
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
                queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
            }

            return conversationId;
        } catch (err: any) {
            setMessages((prev) => prev.slice(0, -1));
            setError(err.message || 'Something went wrong');
            setActivitySteps([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeId, projectId, user, queryClient, loadConversations, githubContext, ephemeral, persistence, surface]);

    const approvePendingAction = useCallback(async (approvalId: string) => {
        if (!user || !projectId) return;
        setIsLoading(true);
        setError(null);
        setMessages((prev) => clearResolvedPendingAction(prev, approvalId));
        try {
            const response = await approveAIAction(projectId, approvalId, user.id);
            const assistantMessage = mapHitlResponseMessage(response);
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            setError(err.message || 'Failed to approve action');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, user]);

    const rejectPendingAction = useCallback(async (approvalId: string) => {
        if (!user || !projectId) return;
        setIsLoading(true);
        setError(null);
        setMessages((prev) => clearResolvedPendingAction(prev, approvalId));
        try {
            const response = await rejectAIAction(projectId, approvalId, user.id);
            const assistantMessage = mapHitlResponseMessage(response);
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            setError(err.message || 'Failed to reject action');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, user]);

    return {
        conversations,
        activeConversationId: activeId,
        messages,
        isLoading,
        isLoadingConversations,
        isLoadingMessages,
        error,
        activitySteps,
        sendMessage,
        approvePendingAction,
        rejectPendingAction,
        selectConversation,
        createConversation,
        renameConversation,
        removeConversation,
        loadConversations
    };
}

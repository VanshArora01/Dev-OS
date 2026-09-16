import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, User, ArrowRight, Sparkles, PanelLeft, BookOpen, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { AIActionApproval } from "@/components/AIActionApproval";
import { AIActionCards } from "@/components/AIActionCards";
import { ConversationSidebar } from "@/components/neural/ConversationSidebar";
import { AgentActivity } from "@/components/neural/AgentActivity";
import { SourcesPanel } from "@/components/neural/SourcesPanel";
import { StreamingMessage } from "@/components/neural/StreamingMessage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PROJECT_SUGGESTIONS = [
  "What is the current project status?",
  "What changed in the repository recently?",
  "Find documents in Google Drive",
  "What is still missing from the PRD?",
  "Summarize recent progress",
  "What should we focus on next?",
];

const WORKSPACE_SUGGESTIONS = [
  "What's my most important project right now?",
  "What should I focus on today?",
  "Which projects are overdue or idle?",
  "Summarize progress across all projects",
];

export function AIPanel({
  projectId,
  surface = "project",
  className,
}: {
  projectId?: string;
  surface?: "project" | "workspace";
  className?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get("conversation");

  const {
    conversations,
    activeConversationId,
    messages,
    sendMessage,
    approvePendingAction,
    rejectPendingAction,
    isLoading,
    isLoadingConversations,
    isLoadingMessages,
    error,
    activitySteps,
    selectConversation,
    createConversation,
    renameConversation,
    removeConversation,
  } = useAIChat(projectId, { activeConversationId: conversationParam, surface, persistence: "persistent" });

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConversationId) {
      const params = new URLSearchParams(searchParams);
      if (params.get("conversation") !== activeConversationId) {
        params.set("conversation", activeConversationId);
        setSearchParams(params, { replace: true });
      }
    }
  }, [activeConversationId, searchParams, setSearchParams]);

  const allSources = useMemo(() => {
    const seen = new Set<string>();
    const sources: { title: string; url?: string; fileId?: string }[] = [];
    for (const msg of messages) {
      for (const s of msg.sources || []) {
        const key = s.fileId || s.title;
        if (!seen.has(key)) {
          seen.add(key);
          sources.push(s);
        }
      }
    }
    return sources;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activitySteps]);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    const params = new URLSearchParams(searchParams);
    params.set("conversation", id);
    setSearchParams(params, { replace: true });
    setSidebarOpen(false);
  };

  const handleCreateConversation = async () => {
    const id = await createConversation();
    if (id) {
      const params = new URLSearchParams(searchParams);
      params.set("conversation", id);
      setSearchParams(params, { replace: true });
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className={cn(
      "relative flex min-h-[480px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#12121a] shadow-rest",
      className || "h-[calc(100vh-92px)]"
    )}>
      {/* Soft AI cue — single quiet wash, not a neon mesh */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70 dark:opacity-40"
        style={{
          background:
            "radial-gradient(80% 120% at 70% -10%, rgba(108, 92, 231, 0.08), transparent 70%)",
        }}
      />

      <div className={`relative z-10 ${sidebarOpen ? "flex" : "hidden"} lg:flex w-64 shrink-0 flex-col min-h-0`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          isLoading={isLoadingConversations}
          onSelect={handleSelectConversation}
          onCreate={handleCreateConversation}
          onRename={renameConversation}
          onDelete={removeConversation}
          collapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-0 bg-[#FBFBFD] dark:bg-[#0e0e14]">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200/70 dark:border-white/[0.06] shrink-0 bg-white/90 dark:bg-[#12121a]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500"
            >
              <PanelLeft size={16} />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">Neural AI</h2>
              <p className="text-[11px] text-slate-400 truncate">
                {activeConversationId
                  ? conversations.find((c) => c._id === activeConversationId)?.title || "Conversation"
                  : "Select or start a conversation"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allSources.length > 0 && (
              <button
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  sourcesOpen
                    ? "bg-brand/10 text-brand border-brand/20"
                    : "text-slate-500 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-800"
                )}
              >
                <BookOpen size={13} />
                Sources
                <span className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-[9px] font-bold text-slate-600 dark:text-zinc-300">
                  {allSources.length}
                </span>
              </button>
            )}
            <Button onClick={handleCreateConversation} size="sm" className="hidden sm:flex btn-primary h-8">
              New chat
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4">
          {isLoadingMessages && messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading conversation…</div>
          )}

          {!isLoadingMessages && !activeConversationId && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-5">
              <div className="h-14 w-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-glow">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                  {surface === "workspace" ? "Neural for your workspace" : "Neural for this project"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md">
                  {surface === "workspace"
                    ? "Ask what's most important, what's overdue, and what to focus on today — across every project."
                    : "Ask about status, Drive, or what to ship next. Answers stay grounded in this workspace."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                { (surface === "workspace" ? WORKSPACE_SUGGESTIONS : PROJECT_SUGGESTIONS).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-4 py-3 text-sm text-left rounded-2xl bg-white dark:bg-white/[0.04] hover:border-brand/30 border border-slate-200 dark:border-white/[0.08] font-medium text-slate-700 dark:text-zinc-200 active:scale-[0.98] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const streaming = isLoading && i === messages.length - 1 && msg.role === "assistant";
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={msg._id || i}
                    initial={isUser ? { opacity: 0, x: 24 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.32, ease: motionEase }}
                    className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-slate-100 dark:bg-white/[0.06] text-brand border border-slate-200/80 dark:border-white/10">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className={`max-w-[85%] space-y-1 ${isUser ? "order-first" : ""}`}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5",
                          isUser
                            ? "bg-brand text-white rounded-br-md"
                            : streaming
                              ? "bg-white dark:bg-white/[0.05] border border-brand/20 shadow-sm"
                              : "bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm"
                        )}
                      >
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <StreamingMessage content={msg.content} streaming={streaming} />
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <Collapsible className="mt-2 group/ctx">
                            <CollapsibleTrigger className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 text-[11px] font-semibold hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors">
                              Retrieved project context
                              <span className="h-4 min-w-4 px-1 rounded-full bg-white dark:bg-black/30 text-[9px] font-bold text-slate-500">
                                {msg.sources.length}
                              </span>
                              <ChevronDown size={12} />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-2 space-y-1 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-2.5">
                                {msg.sources.map((s, si) => (
                                  <p key={si} className="text-[11px] text-slate-500 truncate">
                                    {s.title}
                                  </p>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {msg.toolActivity && msg.toolActivity.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-0.5">
                            {msg.toolActivity.map((t, j) => (
                              <p key={j} className="font-mono text-[10px] text-slate-500 flex items-center gap-1.5">
                                <span className={t.success ? "text-emerald-500" : "text-rose-500"}>●</span>
                                {t.label}
                              </p>
                            ))}
                          </div>
                        )}

                        {msg.metadata?.action_cards && msg.metadata.action_cards.length > 0 && (
                          <AIActionCards cards={msg.metadata.action_cards} />
                        )}

                        {msg.metadata?.pending_action && (
                          <AIActionApproval
                            pendingAction={msg.metadata.pending_action}
                            onApprove={() => approvePendingAction(msg.metadata!.pending_action!.id)}
                            onReject={() => rejectPendingAction(msg.metadata!.pending_action!.id)}
                            isLoading={isLoading}
                          />
                        )}
                      </div>
                      {msg.createdAt && (
                        <p className="font-mono text-[10px] text-slate-400 px-0.5">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </p>
                      )}
                    </div>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-300">
                        <User size={13} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isLoading && <AgentActivity steps={activitySteps} isLoading={isLoading} />}

            {error && (
              <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/70 dark:border-white/[0.06] px-4 py-3 bg-white dark:bg-[#12121a]">
          <div className="max-w-3xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask Neural AI…"
              disabled={isLoading}
              className="w-full bg-[#F7F7FB] dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full py-3 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 disabled:opacity-60 transition-shadow"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className={cn(
                "btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 px-0 rounded-full",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? (
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "240ms" }} />
                </span>
              ) : (
                <ArrowRight size={14} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {sourcesOpen && allSources.length > 0 && (
        <div className="relative z-10 hidden md:flex w-56 shrink-0 min-h-0 border-l border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#12121a]">
          <SourcesPanel
            sources={allSources}
            onClose={() => setSourcesOpen(false)}
            onSelectSource={(source) => {
              if (source.sourceType === 'github' && source.path) {
                const next = new URLSearchParams(searchParams);
                next.set('tab', 'github');
                next.set('ghMode', 'code');
                next.set('ghPath', encodeURIComponent(source.path));
                if (source.commitSha) next.set('ghSha', source.commitSha);
                setSearchParams(next);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

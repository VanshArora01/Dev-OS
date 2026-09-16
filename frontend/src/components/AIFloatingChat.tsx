import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAIChat } from "@/hooks/useAIChat";
import { AIActionApproval } from "@/components/AIActionApproval";
import { AIActionCards } from "@/components/AIActionCards";
import { MessageContent } from "@/components/neural/MessageContent";
import { motionFast } from "@/lib/motion";

function EphemeralChat({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const {
        messages,
        sendMessage,
        approvePendingAction,
        rejectPendingAction,
        isLoading,
        error,
    } = useAIChat(projectId, { persistence: "ephemeral", surface: "project" });
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const text = input;
        setInput("");
        await sendMessage(text);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={motionFast}
            className="mb-3 w-[340px] h-[480px] surface-card flex flex-col overflow-hidden"
        >
            <div className="h-11 px-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Neural AI</p>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1">
                    <X size={14} />
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 && (
                    <p className="text-xs text-slate-400 py-8 text-center">Ask about this project. This chat is temporary.</p>
                )}

                {messages.map((msg, i) => {
                    const streaming = isLoading && i === messages.length - 1 && msg.role === "assistant";
                    return (
                        <div key={msg._id || i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[90%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white"
                                        : streaming
                                          ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30"
                                          : "bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] text-slate-700 dark:text-zinc-200"
                                }`}
                            >
                                {msg.role === "user" ? (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                ) : (
                                    <MessageContent content={msg.content} />
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
                                {msg.createdAt && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {format(new Date(msg.createdAt), "HH:mm")}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-indigo-500/10 border border-indigo-500/30 p-2 rounded-xl">
                            <Loader2 size={14} className="animate-spin text-indigo-400" />
                        </div>
                    </div>
                )}

                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            <div className="p-2.5 border-t border-slate-200 dark:border-white/[0.06]">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask Neural AI…"
                        disabled={isLoading}
                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-20"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export function AIFloatingChat({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && <EphemeralChat projectId={projectId} onClose={() => setIsOpen(false)} />}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-500"
            >
                {isOpen ? <X size={16} /> : <Sparkles size={16} />}
            </button>
        </div>
    );
}

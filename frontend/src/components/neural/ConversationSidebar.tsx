import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Conversation } from "@/lib/api";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onToggle,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation._id);
    setEditTitle(conversation.title);
  };

  const commitRename = (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="flex flex-col h-full min-h-0 border-r border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#12121a]">
      <div className="h-12 px-3 border-b border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Conversations</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="New conversation"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="px-2 py-6 text-center">
            <MessageSquare size={20} className="mx-auto mb-2 text-slate-300 dark:text-zinc-600" />
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">No conversations yet</p>
            <button
              onClick={onCreate}
              className="mt-3 text-[10px] font-bold uppercase tracking-widest text-brand hover:underline"
            >
              Start one
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {conversations.map((conversation) => {
            const isActive = conversation._id === activeId;
            const isEditing = editingId === conversation._id;

            return (
              <motion.div
                key={conversation._id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`group relative rounded-xl transition-colors ${
                  isActive
                    ? "bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10"
                    : "hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="neural-active-rail"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {isEditing ? (
                  <div className="px-2 py-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(conversation._id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => commitRename(conversation._id)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button onClick={() => onSelect(conversation._id)} className="w-full text-left px-3 py-2.5 min-w-0">
                    <p
                      className={`text-[12px] font-medium truncate ${
                        isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-300"
                      }`}
                    >
                      {conversation.title}
                    </p>
                    {conversation.lastMessageAt && (
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </p>
                    )}
                  </button>
                )}

                {!isEditing && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(conversation);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-zinc-800"
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conversation._id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

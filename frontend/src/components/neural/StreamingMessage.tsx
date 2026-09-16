import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageContent } from "@/components/neural/MessageContent";

/** Word-by-word fade for streaming assistant responses. */
export function StreamingMessage({ content, streaming }: { content: string; streaming: boolean }) {
  const words = useMemo(() => content.split(/(\s+)/).filter((w) => w.length > 0), [content]);
  const [shown, setShown] = useState(words.length);

  useEffect(() => {
    if (!streaming) {
      setShown(words.length);
      return;
    }
    setShown((prev) => Math.min(words.length, Math.max(prev, 1)));
  }, [content, streaming, words.length]);

  useEffect(() => {
    if (!streaming || shown >= words.length) return;
    const id = window.setTimeout(() => setShown((n) => Math.min(words.length, n + 2)), 32);
    return () => clearTimeout(id);
  }, [shown, words.length, streaming]);

  if (!streaming) {
    return <MessageContent content={content} />;
  }

  const visible = words.slice(0, shown);
  return (
    <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
      {visible.map((chunk, i) =>
        chunk.trim() ? (
          <motion.span
            key={`${i}-${chunk.slice(0, 8)}`}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16 }}
          >
            {chunk}
          </motion.span>
        ) : (
          <span key={`ws-${i}`}>{chunk}</span>
        )
      )}
      <motion.span
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-brand/70 rounded-sm"
      />
    </p>
  );
}

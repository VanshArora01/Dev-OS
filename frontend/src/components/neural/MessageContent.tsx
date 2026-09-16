function formatInline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.9em]">$1</code>');
}

export function MessageContent({ content }: { content: string }) {
    const blocks = content.split(/\n{2,}/);

    return (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
            {blocks.map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('```')) {
                    const code = trimmed.replace(/^```[\w]*\n?/, '').replace(/```$/, '');
                    return (
                        <pre
                            key={i}
                            className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono"
                        >
                            <code>{code}</code>
                        </pre>
                    );
                }

                if (trimmed.match(/^[-*]\s/m)) {
                    const items = trimmed.split('\n').filter((l) => l.match(/^[-*]\s/));
                    return (
                        <ul key={i} className="list-disc list-inside space-y-1">
                            {items.map((item, j) => (
                                <li key={j}>{item.replace(/^[-*]\s+/, '')}</li>
                            ))}
                        </ul>
                    );
                }

                if (trimmed.startsWith('#')) {
                    const level = trimmed.match(/^#+/)?.[0].length || 1;
                    const text = trimmed.replace(/^#+\s*/, '');
                    const Tag = level <= 2 ? 'h3' : 'h4';
                    return (
                        <Tag
                            key={i}
                            className={`font-semibold text-slate-900 dark:text-white ${level <= 2 ? 'text-base' : 'text-sm'}`}
                        >
                            {text}
                        </Tag>
                    );
                }

                return (
                    <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/\n/g, '<br/>')) }} />
                );
            })}
        </div>
    );
}

import { useEffect, useMemo, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'next-themes';

function languageExtension(path: string, language?: string) {
  const ext = path.split('.').pop()?.toLowerCase() || language || '';
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'typescript', 'javascript'].includes(ext)) {
    return javascript({ jsx: ext.includes('x'), typescript: ext.startsWith('ts') });
  }
  if (ext === 'json') return json();
  if (ext === 'md' || ext === 'markdown') return markdown();
  if (ext === 'py' || ext === 'python') return python();
  if (ext === 'html') return html();
  if (ext === 'css') return css();
  return javascript();
}

export function CodeViewer({
  path,
  language,
  content,
  binary,
  tooLarge,
  line,
}: {
  path: string;
  language?: string;
  content: string;
  binary?: boolean;
  tooLarge?: boolean;
  line?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  const extensions = useMemo(
    () => [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      search(),
      highlightSelectionMatches(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      languageExtension(path, language),
      EditorView.editable.of(false),
      EditorState.readOnly.of(true),
      EditorView.lineWrapping,
      ...(dark ? [oneDark] : []),
      EditorView.theme({
        '&': { height: '100%', fontSize: '12.5px', backgroundColor: 'transparent' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
      }),
    ],
    [path, language, dark]
  );

  useEffect(() => {
    if (!hostRef.current || binary || tooLarge) return;
    viewRef.current?.destroy();
    const view = new EditorView({
      state: EditorState.create({ doc: content || '', extensions }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    if (line && line > 0) {
      const pos = view.state.doc.line(Math.min(line, view.state.doc.lines)).from;
      view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
    }
    return () => view.destroy();
  }, [content, path, extensions, binary, tooLarge, line]);

  if (binary) {
    return <div className="p-6 text-sm text-slate-500">This file looks binary and is not displayed.</div>;
  }
  if (tooLarge) {
    return <div className="p-6 text-sm text-slate-500">This file is too large to preview safely in DevOS.</div>;
  }

  return <div ref={hostRef} className="h-full min-h-0 github-cm" />;
}

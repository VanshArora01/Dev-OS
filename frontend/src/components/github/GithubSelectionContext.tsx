import { createContext, useContext } from 'react';
import type { GithubLinkedRepository } from '@/lib/types';

export type GithubCanvasMode = 'overview' | 'graph' | 'code' | 'activity';
export type GithubFocusMode = 'default' | 'code' | 'graph' | 'activity';
export type GithubKind = 'repo' | 'folder' | 'file' | 'commit' | 'pr';

export interface GithubSelection {
  path: string;
  kind: GithubKind;
  sha?: string;
  pr?: number;
  line?: number;
}

export interface GithubWorkspaceState {
  projectId: string;
  clerkId: string;
  repo: GithubLinkedRepository | null;
  branch: string;
  setBranch: (branch: string) => void;
  selection: GithubSelection;
  setSelection: (next: Partial<GithubSelection> & { path?: string; kind?: GithubKind }) => void;
  canvasMode: GithubCanvasMode;
  setCanvasMode: (mode: GithubCanvasMode) => void;
  focusMode: GithubFocusMode;
  setFocusMode: (mode: GithubFocusMode) => void;
  neuralScope: GithubKind | 'folder' | 'file' | 'repo';
}

export const GithubWorkspaceContext = createContext<GithubWorkspaceState | null>(null);

export function useGithubWorkspace() {
  const ctx = useContext(GithubWorkspaceContext);
  if (!ctx) throw new Error('useGithubWorkspace must be used inside GithubWorkspace');
  return ctx;
}

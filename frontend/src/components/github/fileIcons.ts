import {
  Braces,
  Boxes,
  Database,
  FileCode,
  FileCode2,
  FileCog,
  FileJson,
  FileText,
  FileType,
  Folder,
  FolderGit2,
  Image,
  KeyRound,
  Package,
  type LucideIcon,
} from 'lucide-react';

export type GraphNodeKind = 'repo' | 'folder' | 'source' | 'config' | 'module' | 'data' | 'external';

export const NODE_COLORS: Record<GraphNodeKind, string> = {
  repo: '#4F46E5',
  folder: '#F59E0B',
  source: '#7C6CF6',
  config: '#0EA5E9',
  module: '#059669',
  data: '#F43F5E',
  external: '#71717A',
};

export const NODE_ICONS: Record<GraphNodeKind, LucideIcon> = {
  repo: FolderGit2,
  folder: Folder,
  source: FileCode,
  config: FileCog,
  module: Boxes,
  data: Database,
  external: Package,
};

const EXT_ICONS: Record<string, LucideIcon> = {
  '.ts': FileType,
  '.tsx': FileCode2,
  '.js': FileCode,
  '.jsx': FileCode2,
  '.mjs': FileCode,
  '.json': FileJson,
  '.md': FileText,
  '.env': KeyRound,
  '.yml': Braces,
  '.yaml': Braces,
  '.css': FileCog,
  '.html': FileText,
  '.py': FileCode,
  '.png': Image,
  '.svg': Image,
};

const CONFIG_NAMES = new Set(['package.json', 'tsconfig.json', 'vite.config.ts', '.env', '.gitignore', 'dockerfile']);
const DATA_EXTS = new Set(['.sql', '.prisma', '.graphql']);
const MODULE_HINTS = ['service', 'controller', 'routes', 'executor'];

export function fileIconForPath(path: string, isDir = false): LucideIcon {
  if (isDir) return Folder;
  const name = path.split('/').pop() || '';
  const ext = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : '';
  return EXT_ICONS[ext] || FileCode;
}

export function graphKindForPath(path: string, type: 'file' | 'dir' | 'repo' | 'external' = 'file'): GraphNodeKind {
  if (type === 'repo') return 'repo';
  if (type === 'dir') return 'folder';
  if (type === 'external') return 'external';
  const name = path.split('/').pop()?.toLowerCase() || '';
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  if (CONFIG_NAMES.has(name) || ['.json', '.yml', '.yaml', '.toml'].includes(ext) && name.includes('config')) return 'config';
  if (DATA_EXTS.has(ext) || name.includes('model') || name.includes('schema')) return 'data';
  if (MODULE_HINTS.some((hint) => name.includes(hint))) return 'module';
  if (['.json', '.yml', '.yaml', '.env', '.toml'].includes(ext)) return 'config';
  return 'source';
}

export const HIERARCHY_NODE_CAP = 48;
export const FOCUS_NODE_CAP = 24;
export const MINIMAP_THRESHOLD = 24;
export const NODE_ENTER_STAGGER_MS = 40;

/// <reference types="vite/client" />

interface ElectronAuthAPI {
  startOAuthCallback: () => Promise<{ callbackUrl: string }>;
  openExternal: (url: string) => Promise<{ opened: boolean }>;
  waitForOAuthCallback: () => Promise<{ callbackUrl: string }>;
  cancelOAuth: () => Promise<{ cancelled: boolean }>;
}

interface ElectronSessionAPI {
  startSession: () => void;
  endSession: () => Promise<{
    images?: { base64: string; mimeType: string }[];
    duration?: number;
    totalScreenshots?: number;
    selectedScreenshots?: number;
    error?: string;
  } | null>;
  setActiveProject: (data: { id?: string; name?: string; clerkId?: string }) => void;
  openMainWindow: () => void;
  moveWindow: (offset: { x: number; y: number }) => void;
  closeWidget: () => void;
  onSessionStarted: (callback: (data?: { startTime?: number }) => void) => void;
  onSessionEnded: (callback: () => void) => void;
  onScreenshotTaken: (callback: (count: number) => void) => void;
  onEndSession: (callback: (data: {
    images?: { base64: string; mimeType: string }[];
    duration?: number;
    totalScreenshots?: number;
    selectedScreenshots?: number;
    error?: string;
  }) => void) => void;
}

interface Window {
  electronAPI?: ElectronSessionAPI & ElectronAuthAPI;
}

import { cn } from "@/lib/utils";

type DevOSLogoProps = {
  size?: number;
  className?: string;
  /** When true, renders only the mark without the gradient tile background */
  monochrome?: boolean;
};

/**
 * DevOS brand mark — stacked context layers (workspace continuity).
 */
export function DevOSLogo({ size = 32, className, monochrome = false }: DevOSLogoProps) {
  if (monochrome) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={cn("shrink-0", className)}
        aria-hidden
      >
        <rect x="14" y="17" width="36" height="9" rx="4.5" fill="currentColor" opacity="0.95" />
        <rect x="14" y="28" width="26" height="9" rx="4.5" fill="currentColor" opacity="0.55" />
        <rect x="14" y="39" width="32" height="9" rx="4.5" fill="currentColor" opacity="0.75" />
        <rect x="50" y="28" width="6" height="9" rx="3" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="devos-logo-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B7CF8" />
          <stop offset="1" stopColor="#5B4BD1" />
        </linearGradient>
        <linearGradient id="devos-logo-shine" x1="12" y1="8" x2="40" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#devos-logo-bg)" />
      <rect width="64" height="64" rx="16" fill="url(#devos-logo-shine)" />
      <rect x="14" y="17" width="36" height="9" rx="4.5" fill="#FFFFFF" fillOpacity="0.95" />
      <rect x="14" y="28" width="26" height="9" rx="4.5" fill="#FFFFFF" fillOpacity="0.5" />
      <rect x="14" y="39" width="32" height="9" rx="4.5" fill="#FFFFFF" fillOpacity="0.72" />
      <rect x="50" y="28" width="6" height="9" rx="3" fill="#FFFFFF" fillOpacity="0.35" />
    </svg>
  );
}

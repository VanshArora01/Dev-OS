export const motionEase = [0.16, 1, 0.3, 1] as const;

export const motionFast = { duration: 0.18, ease: motionEase };
export const motionPage = { duration: 0.28, ease: motionEase };
export const motionSpring = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.8 };
export const motionSoftSpring = { type: "spring" as const, stiffness: 280, damping: 28 };

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: motionEase },
  },
};

export function truncateText(value: string | undefined | null, max = 140) {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export const COMMAND_EVENT = "devos:command";

export function openCommandPalette() {
  window.dispatchEvent(new Event(COMMAND_EVENT));
}

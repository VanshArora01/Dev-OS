import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { TourStep } from './tourSteps';

interface OnboardingOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  tourTitle: string;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  step,
  stepIndex,
  totalSteps,
  tourTitle,
  onNext,
  onPrev,
  onSkip
}) => {
  const [rect, setRect] = useState<ElementRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) {
      setRect(null);
      return;
    }

    const bounds = el.getBoundingClientRect();
    const padding = 6;
    const targetRect: ElementRect = {
      top: Math.max(0, bounds.top - padding),
      left: Math.max(0, bounds.left - padding),
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2
    };

    setRect(targetRect);

    // Calculate Popover placement
    const cardWidth = cardRef.current?.offsetWidth || 380;
    const cardHeight = cardRef.current?.offsetHeight || 220;
    const margin = 16;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    const preferredPos = step.position || 'bottom';

    if (preferredPos === 'bottom') {
      top = targetRect.top + targetRect.height + margin;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    } else if (preferredPos === 'top') {
      top = targetRect.top - cardHeight - margin;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    } else if (preferredPos === 'right') {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      left = targetRect.left + targetRect.width + margin;
    } else if (preferredPos === 'left') {
      top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      left = targetRect.left - cardWidth - margin;
    } else {
      // Auto
      top = targetRect.top + targetRect.height + margin;
      left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    }

    // Boundary checks & fallbacks
    if (top + cardHeight > winHeight - margin) {
      top = targetRect.top - cardHeight - margin;
    }
    if (top < margin) {
      top = margin;
    }
    if (left + cardWidth > winWidth - margin) {
      left = winWidth - cardWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    setPopoverPos({ top, left });
  }, [step.target, step.position]);

  useEffect(() => {
    updatePosition();
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const observer = new ResizeObserver(updatePosition);
    const targetEl = document.querySelector(step.target);
    if (targetEl) observer.observe(targetEl);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      observer.disconnect();
    };
  }, [updatePosition, step.target]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onNext();
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip, stepIndex]);

  const winW = window.innerWidth;
  const winH = window.innerHeight;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto font-sans selection:bg-indigo-500/30">
      {/* SVG Spotlight Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width={winW} height={winH} fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width={winW}
          height={winH}
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight Ring Glow */}
      {rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }}
          className="pointer-events-none rounded-2xl border-2 border-indigo-500/90 shadow-[0_0_35px_rgba(99,102,241,0.6)] animate-pulse"
        />
      )}

      {/* Popover Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: popoverPos.top,
            left: popoverPos.left
          }}
          className="w-[380px] max-w-[calc(100vw-32px)] rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={12} />
                {tourTitle}
              </span>
              <span className="text-[11px] font-bold text-white/40">
                {stepIndex + 1} of {totalSteps}
              </span>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              title="Skip Walkthrough"
            >
              <X size={14} />
            </button>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-black text-white tracking-tight mb-2">
            {step.title}
          </h3>

          <p className="text-xs font-medium text-white/70 leading-relaxed mb-4">
            {step.description}
          </p>

          {step.detail && (
            <div className="mb-5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5">
              <CheckCircle2 size={12} className="text-indigo-400 shrink-0" />
              {step.detail}
            </div>
          )}

          {/* Progress Bar & Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            {/* Progress Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={onNext}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)] transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                {stepIndex === totalSteps - 1 ? 'Got it' : 'Next'}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

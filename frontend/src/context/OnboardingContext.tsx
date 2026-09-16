import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { TOURS, TourStep, TourDefinition } from '../components/onboarding/tourSteps';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const ONBOARDING_VERSION = 'v1';

interface TourCompletionState {
  dashboard?: boolean;
  project?: boolean;
  github?: boolean;
  google_drive?: boolean;
  gmail?: boolean;
  neural?: boolean;
}

interface OnboardingContextType {
  activeTour: TourDefinition | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  startTour: (tourId: string, force?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTours: () => void;
  completedTours: TourCompletionState;
  showProjectBanner: boolean;
  dismissProjectBanner: () => void;
  triggerFirstProjectTour: (projectId: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const userId = user?.id || 'guest';
  const storageKey = `devos_onboarding_${ONBOARDING_VERSION}_${userId}`;

  const [completedTours, setCompletedTours] = useState<TourCompletionState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showProjectBanner, setShowProjectBanner] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  // Sync state to user-scoped localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedTours));
    } catch (e) {
      console.warn('[Onboarding] Failed to save state:', e);
    }
  }, [completedTours, storageKey]);

  const currentStep = activeTour?.steps[currentStepIndex] || null;

  const markTourComplete = useCallback((tourId: string) => {
    setCompletedTours((prev) => ({ ...prev, [tourId]: true }));
  }, []);

  const startTour = useCallback(
    (tourId: string, force = false) => {
      const tour = TOURS[tourId];
      if (!tour) return;
      if (!force && completedTours[tourId as keyof TourCompletionState]) {
        return; // Already completed
      }
      setActiveTour(tour);
      setCurrentStepIndex(0);
    },
    [completedTours]
  );

  const resetTours = useCallback(() => {
    setCompletedTours({});
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const skipTour = useCallback(() => {
    if (activeTour) {
      markTourComplete(activeTour.id);
    }
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, [activeTour, markTourComplete]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    if (currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      markTourComplete(activeTour.id);
      setActiveTour(null);
      setCurrentStepIndex(0);
    }
  }, [activeTour, currentStepIndex, markTourComplete]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Handle route / tab navigation when step changes
  useEffect(() => {
    if (!currentStep) return;

    let targetRoute = currentStep.route;
    if (currentStep.tabId && location.pathname.startsWith('/project/')) {
      const currentTab = searchParams.get('tab') || 'today';
      if (currentTab !== currentStep.tabId) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', currentStep.tabId);
        navigate(`${location.pathname}?${nextParams.toString()}`, { replace: true });
        return;
      }
    }

    if (targetRoute && location.pathname !== targetRoute) {
      setIsNavigating(true);
      navigate(targetRoute);
    } else {
      setIsNavigating(false);
    }
  }, [currentStep, location.pathname, searchParams, navigate]);

  // Wait for target element to mount safely
  useEffect(() => {
    if (!currentStep || isNavigating) return;

    let attempts = 0;
    const maxAttempts = 25; // 2.5s total timeout
    const interval = setInterval(() => {
      attempts++;
      const el = document.querySelector(currentStep.target);
      if (el) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.warn(`[Onboarding] Target element not found: ${currentStep.target}. Skipping step.`);
        // Safely skip if target element unavailable
        nextStep();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, isNavigating, nextStep]);

  // First sign-in trigger: Start Dashboard tour if not completed
  useEffect(() => {
    if (user && !completedTours.dashboard && !activeTour && location.pathname === '/') {
      const timer = setTimeout(() => {
        startTour('dashboard');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, completedTours.dashboard, activeTour, location.pathname, startTour]);

  const triggerFirstProjectTour = useCallback((projectId: string) => {
    setPendingProjectId(projectId);
    setShowProjectBanner(true);
  }, []);

  const dismissProjectBanner = useCallback(() => {
    setShowProjectBanner(false);
  }, []);

  const handleStartProjectTourFromBanner = useCallback(() => {
    setShowProjectBanner(false);
    if (pendingProjectId) {
      navigate(`/project/${pendingProjectId}?tab=today`);
      setTimeout(() => {
        startTour('project', true);
      }, 600);
    }
  }, [pendingProjectId, navigate, startTour]);

  return (
    <OnboardingContext.Provider
      value={{
        activeTour,
        currentStepIndex,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetTours,
        completedTours,
        showProjectBanner,
        dismissProjectBanner,
        triggerFirstProjectTour
      }}
    >
      {children}

      {/* Active Spotlight Overlay */}
      {activeTour && currentStep && !isNavigating && (
        <OnboardingOverlay
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={activeTour.steps.length}
          tourTitle={activeTour.title}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}

      {/* First Project Ready Banner */}
      <AnimatePresence>
        {showProjectBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-[9990] w-96 rounded-3xl border border-indigo-500/30 bg-zinc-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white font-sans"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Your project is ready!</h4>
                  <p className="text-[11px] text-white/60 font-medium">Let's take a 30-second tour.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4">
              DevOS has generated your structured project brief, initial task board, and technical context.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismissProjectBanner}
                className="h-8 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 transition-colors"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleStartProjectTourFromBanner}
                className="h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 hover:scale-105"
              >
                Start Tour
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

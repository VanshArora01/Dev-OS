import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, Layers, ChevronRight, Rocket } from "lucide-react";

interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    title: "WELCOME TO DEVOS",
    subtitle: "THE NEURAL ENGINE",
    description: "Initialize your workspace with a persistent operating system designed for the modern engineer.",
    icon: <Zap className="w-12 h-12 text-indigo-400" />,
    color: "from-indigo-600/20 to-transparent",
  },
  {
    title: "NEVER LOSE CONTEXT",
    subtitle: "NEURAL TRAJECTORY",
    description: "We monitor your progress across sessions, ensuring you never lose that 'flow' state when returning to a task.",
    icon: <Target className="w-12 h-12 text-emerald-400" />,
    color: "from-emerald-600/20 to-transparent",
  },
  {
    title: "PROJECT CONTINUITY",
    subtitle: "TASK PERSISTENCE",
    description: "Every screenshot, every thought, every shard of code is preserved and analyzed to boost your deployment velocity.",
    icon: <Layers className="w-12 h-12 text-amber-400" />,
    color: "from-amber-600/20 to-transparent",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${steps[currentStep].color}`}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-lg w-full px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="text-center"
          >
            {/* Icon Sphere */}
            <div className="mx-auto mb-10 relative">
              <div className="absolute inset-0 blur-3xl opacity-20 bg-current scale-150" />
              <div className="relative h-24 w-24 mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl flex items-center justify-center shadow-2xl">
                {steps[currentStep].icon}
              </div>
            </div>

            <h2 className="text-[10px] font-black tracking-[0.6em] text-white/40 mb-4 uppercase italic">
              {steps[currentStep].subtitle}
            </h2>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-6">
              {steps[currentStep].title}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed font-bold italic tracking-tight mb-12">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-8">
          {/* Progress Dots */}
          <div className="flex gap-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === currentStep ? "w-8 bg-white" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="group relative h-16 w-full rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            {currentStep === steps.length - 1 ? (
              <>
                Initialize System
                <Rocket size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            ) : (
              <>
                Advance Sequence
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          {currentStep < steps.length - 1 && (
            <button
              onClick={onComplete}
              className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase hover:text-white transition-colors"
            >
              Skip Initialization
            </button>
          )}
        </div>
      </div>

      {/* Aesthetic Border */}
      <div className="absolute inset-0 border border-white/5 pointer-events-none m-4 rounded-[2.5rem]" />
    </div>
  );
};

export default Onboarding;

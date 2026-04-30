"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Send,
  Map,
  Users,
  Link2,
  Sparkles,
  CheckCircle2,
  Rocket,
  LayoutDashboard,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to FORGE",
    description:
      "Your AI-powered command center for agile program intelligence. Score stories, craft stakeholder updates, and plan PIs with confidence.",
    icon: <Rocket className="w-6 h-6" />,
    illustration: (
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-iris to-iris-light flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-jade rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      </div>
    ),
  },
  {
    id: "jira",
    title: "Connect JIRA",
    description:
      "Link your Atlassian JIRA instance to automatically sync stories, epics, and sprints. FORGE will keep your data fresh with automatic syncs every 15 minutes.",
    icon: <Link2 className="w-6 h-6" />,
    illustration: (
      <div className="flex items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-02 border border-border flex items-center justify-center">
          <Link2 className="w-7 h-7 text-iris" />
        </div>
        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center"
        >
          <div className="w-8 h-0.5 bg-iris" />
          <ArrowRight className="w-4 h-4 text-iris -ml-1" />
        </motion.div>
        <div className="w-14 h-14 rounded-xl bg-jade-dim border border-jade/30 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-jade" />
        </div>
      </div>
    ),
    highlight: "Go to Settings > JIRA to connect",
  },
  {
    id: "modules",
    title: "Three Powerful Modules",
    description:
      "Quality Gate scores your stories with AI. Signal crafts stakeholder updates in seconds. Horizon visualizes your PI planning with dependencies and risks.",
    icon: <LayoutDashboard className="w-6 h-6" />,
    illustration: (
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-jade-dim border border-jade/30 text-center">
          <ShieldCheck className="w-6 h-6 text-jade mx-auto mb-1" />
          <div className="text-xs text-jade font-medium">Quality Gate</div>
        </div>
        <div className="p-3 rounded-xl bg-iris-dim border border-iris/30 text-center">
          <Send className="w-6 h-6 text-iris mx-auto mb-1" />
          <div className="text-xs text-iris font-medium">Signal</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-dim border border-amber/30 text-center">
          <Map className="w-6 h-6 text-amber mx-auto mb-1" />
          <div className="text-xs text-amber font-medium">Horizon</div>
        </div>
      </div>
    ),
  },
  {
    id: "team",
    title: "Invite Your Team",
    description:
      "Collaboration is key. Invite Scrum Masters, PMs, and RTEs to your workspace. Set roles to control who can manage settings and trigger AI actions.",
    icon: <Users className="w-6 h-6" />,
    illustration: (
      <div className="flex items-center justify-center">
        <div className="flex -space-x-3">
          {["bg-iris", "bg-jade", "bg-amber", "bg-sky"].map((color, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "w-10 h-10 rounded-full border-2 border-surface-01 flex items-center justify-center",
                color
              )}
            >
              <Users className="w-5 h-5 text-white" />
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-10 h-10 rounded-full bg-surface-02 border-2 border-dashed border-border flex items-center justify-center"
          >
            <span className="text-xs text-text-tertiary">+3</span>
          </motion.div>
        </div>
      </div>
    ),
    highlight: "Go to Settings > Team to invite members",
  },
  {
    id: "start",
    title: "Ready to Go!",
    description:
      "You're all set. Start by connecting JIRA to sync your backlog, then score your first story to see AI quality insights in action.",
    icon: <Sparkles className="w-6 h-6" />,
    illustration: (
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-jade to-jade-light flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <Sparkles className="w-4 h-4 text-amber" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
            <Sparkles className="w-4 h-4 text-iris" />
          </div>
        </motion.div>
      </motion.div>
    ),
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-surface-01 border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-03 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-03">
          <motion.div
            className="h-full bg-iris"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentStep ? 1 : -1);
                  setCurrentStep(i);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentStep
                    ? "w-6 bg-iris"
                    : i < currentStep
                    ? "bg-iris/50"
                    : "bg-surface-03"
                )}
              />
            ))}
          </div>

          {/* Animated content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mb-6">{step.illustration}</div>

              {/* Title */}
              <h2 className="text-xl font-bold text-text-primary mb-3">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Highlight */}
              {step.highlight && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-iris-dim rounded-full">
                  <Settings2 className="w-4 h-4 text-iris" />
                  <span className="text-xs text-iris font-medium">
                    {step.highlight}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(isFirstStep && "invisible")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button variant="ghost" onClick={onSkip} className="text-text-tertiary">
                Skip for now
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showTour, setShowTour] = useState(false);
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    // Check if onboarding is complete
    const checkOnboarding = async () => {
      try {
        const res = await fetch("/api/user/onboarding-status");
        if (res.ok) {
          const data = await res.json();
          setIsComplete(data.onboardingComplete);
          setShowTour(!data.onboardingComplete);
        }
      } catch (err) {
        // If there's an error, don't show the tour
        setIsComplete(true);
      }
    };

    checkOnboarding();
  }, []);

  const completeTour = async () => {
    setShowTour(false);
    setIsComplete(true);
    try {
      await fetch("/api/user/onboarding-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
    } catch (err) {
      console.error("Failed to save onboarding status:", err);
    }
  };

  const skipTour = () => {
    setShowTour(false);
    // Don't mark as complete, just dismiss for now
  };

  const restartTour = () => {
    setShowTour(true);
  };

  return {
    showTour,
    isComplete,
    completeTour,
    skipTour,
    restartTour,
  };
}

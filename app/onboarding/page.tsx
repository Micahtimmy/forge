"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  Users,
  Briefcase,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slideUp, fadeIn } from "@/lib/motion/variants";
import { completeOnboarding } from "./actions";

const ROLES = [
  { id: "scrum_master", label: "Scrum Master", icon: Users },
  { id: "product_manager", label: "Product Manager", icon: Briefcase },
  { id: "program_manager", label: "Program Manager", icon: Building2 },
  { id: "rte", label: "Release Train Engineer", icon: User },
  { id: "engineering_manager", label: "Engineering Manager", icon: User },
  { id: "other", label: "Other", icon: User },
] as const;

const TEAM_SIZES = [
  { id: "1-5", label: "1-5 members" },
  { id: "6-20", label: "6-20 members" },
  { id: "21-50", label: "21-50 members" },
  { id: "51-100", label: "51-100 members" },
  { id: "100+", label: "100+ members" },
] as const;

type Step = "welcome" | "workspace" | "role" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("welcome");
  const [workspaceName, setWorkspaceName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeOnboarding({
          workspaceName,
          teamSize,
          role,
        });

        if (result.success) {
          setStep("complete");
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 2000);
        } else {
          setError(result.error || "Failed to complete setup. Please try again.");
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case "welcome":
        return true;
      case "workspace":
        return workspaceName.trim().length >= 2 && teamSize;
      case "role":
        return role;
      default:
        return false;
    }
  };

  const nextStep = () => {
    switch (step) {
      case "welcome":
        setStep("workspace");
        break;
      case "workspace":
        setStep("role");
        break;
      case "role":
        handleComplete();
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case "workspace":
        setStep("welcome");
        break;
      case "role":
        setStep("workspace");
        break;
    }
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="bg-surface-01 rounded-xl border border-border p-8"
    >
      {/* Progress indicator */}
      {step !== "complete" && (
        <div className="flex items-center gap-2 mb-8">
          {["welcome", "workspace", "role"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? "bg-iris text-white"
                    : ["workspace", "role"].indexOf(step) > i ||
                      (step === "role" && s === "workspace")
                    ? "bg-jade text-white"
                    : "bg-surface-02 text-text-tertiary"
                }`}
              >
                {["workspace", "role"].indexOf(step) > i ||
                (step === "role" && s === "workspace") ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 mx-2 transition-colors ${
                    ["workspace", "role"].indexOf(step) > i ||
                    (step === "role" && s === "welcome")
                      ? "bg-jade"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-iris-dim flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-iris" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">
                Welcome to FORGE
              </h1>
              <p className="text-text-secondary mt-2 max-w-md mx-auto">
                Let&apos;s set up your workspace and get you ready to supercharge your
                agile delivery with AI-powered insights.
              </p>
            </div>
            <div className="pt-4">
              <Button type="button" onClick={nextStep} className="min-w-[200px]">
                Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "workspace" && (
          <motion.div
            key="workspace"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">
                Set up your workspace
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Tell us about your team to customize your experience
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input
                  id="workspaceName"
                  type="text"
                  placeholder="e.g., Acme Engineering"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
                <p className="text-xs text-text-tertiary mt-1">
                  This is usually your company or team name
                </p>
              </div>

              <div>
                <Label>Team size</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setTeamSize(size.id)}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        teamSize === size.id
                          ? "bg-iris-dim border-iris text-iris"
                          : "bg-surface-02 border-border text-text-secondary hover:border-text-tertiary"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "role" && (
          <motion.div
            key="role"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">
                What&apos;s your role?
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                We&apos;ll customize your dashboard based on your responsibilities
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-coral-dim border border-coral-border text-coral text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                      role === r.id
                        ? "bg-iris-dim border-iris"
                        : "bg-surface-02 border-border hover:border-text-tertiary"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        role === r.id ? "bg-iris/20" : "bg-surface-01"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          role === r.id ? "text-iris" : "text-text-tertiary"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        role === r.id ? "text-iris" : "text-text-secondary"
                      }`}
                    >
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="complete"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            className="text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto rounded-full bg-jade-dim flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-jade" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-display font-bold text-text-primary">
                You&apos;re all set!
              </h2>
              <p className="text-text-secondary mt-2">
                Taking you to your dashboard...
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-iris" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

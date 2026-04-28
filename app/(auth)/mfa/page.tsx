"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastActions } from "@/components/ui/toast";
import { fadeIn } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import { listMFAFactors, verifyMFACode } from "@/lib/auth/mfa";

function MFAForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastActions();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    async function loadFactors() {
      const result = await listMFAFactors();
      if (result.success && result.factors.length > 0) {
        const verifiedFactor = result.factors.find(
          (f) => f.status === "verified"
        );
        if (verifiedFactor) {
          setFactorId(verifiedFactor.id);
        }
      }
      setLoading(false);
    }
    loadFactors();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!factorId || code.length !== 6) return;

    startTransition(async () => {
      const result = await verifyMFACode(factorId, code);

      if (result.success) {
        toast.success("Verified!", "Two-factor authentication successful.");
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(result.error || "Invalid code. Please try again.");
        setCode("");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-iris/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-iris" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Two-Factor Authentication
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-coral-dim border border-coral-border text-coral text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            className={cn(
              "w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em]",
              "bg-surface-02 border border-border rounded-lg",
              "text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-iris/50 focus:border-iris"
            )}
            autoFocus
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || code.length !== 6}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-text-tertiary">
          Open your authenticator app (Google Authenticator, Authy, etc.) and
          enter the code for FORGE
        </p>
      </div>

      {/* Recovery option */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-text-secondary">
          Lost access to your authenticator?{" "}
          <a href="/support" className="text-iris hover:text-iris-light">
            Contact support
          </a>
        </p>
      </div>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center">
        <div className="w-14 h-14 bg-surface-02 rounded-full mx-auto mb-4" />
        <div className="h-8 w-64 bg-surface-02 rounded mx-auto" />
        <div className="h-4 w-80 bg-surface-02 rounded mx-auto mt-2" />
      </div>
      <div className="h-16 bg-surface-02 rounded" />
      <div className="h-10 bg-surface-02 rounded" />
    </div>
  );
}

export default function MFAPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MFAForm />
    </Suspense>
  );
}

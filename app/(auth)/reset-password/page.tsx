"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeIn, slideUp } from "@/lib/motion/variants";
import { updatePassword } from "@/lib/auth/actions";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check for error codes in URL (from Supabase)
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    if (errorCode) {
      setError(errorDescription || "Invalid or expired reset link. Please request a new one.");
    }
  }, [errorCode, errorDescription]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const formData = new FormData();
    formData.set("password", password);

    startTransition(async () => {
      const result = await updatePassword(formData);

      if (result.success) {
        setSuccess(true);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(result.error || "Failed to reset password");
      }
    });
  };

  // Show success screen
  if (success) {
    return (
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-jade-dim flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-jade" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Password reset successful
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            Your password has been updated. Redirecting you to the dashboard...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-iris" />
        </div>
      </motion.div>
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
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Set new password
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Create a strong password for your account
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-coral-dim border border-coral-border text-coral text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span>{error}</span>
            {errorCode && (
              <p className="mt-1">
                <Link href="/forgot-password" className="underline hover:no-underline">
                  Request a new reset link
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isPending || !!errorCode}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={isPending || !!errorCode}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= level * 3
                      ? password.length >= 12
                        ? "bg-jade"
                        : password.length >= 8
                        ? "bg-amber"
                        : "bg-coral"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-text-tertiary">
              {password.length < 8
                ? "Too short"
                : password.length < 12
                ? "Good"
                : "Strong"}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending || !!errorCode}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-secondary">
        Remember your password?{" "}
        <Link href="/login" className="text-iris hover:text-iris-light font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center lg:text-left">
        <div className="h-8 w-48 bg-surface-02 rounded" />
        <div className="h-4 w-64 bg-surface-02 rounded mt-2" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-surface-02 rounded" />
        <div className="h-10 bg-surface-02 rounded" />
        <div className="h-10 bg-surface-02 rounded" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

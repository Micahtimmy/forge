"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToastActions } from "@/components/ui/toast";
import { fadeIn } from "@/lib/motion/variants";
import { signIn, signInWithGoogle, signInWithGitHub } from "@/lib/auth/actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastActions();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/";
  const authError = searchParams.get("error");
  const authErrorDescription = searchParams.get("error_description");

  // Map error codes to user-friendly messages
  const getErrorMessage = (error: string | null, description: string | null) => {
    if (!error) return null;

    const errorMessages: Record<string, string> = {
      "auth_callback_error": "Authentication failed. Please try again.",
      "missing_auth_params": "Invalid authentication link. Please try signing in again.",
      "verification_failed": description || "Email verification failed. The link may have expired.",
      "confirmation_failed": description || "Email confirmation failed. Please request a new link.",
      "missing_token": "Invalid confirmation link. Please request a new one.",
      "access_denied": "Access was denied. Please try again.",
    };

    return errorMessages[error] || description || "Authentication failed. Please try again.";
  };

  const errorMessage = getErrorMessage(authError, authErrorDescription);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("redirect", redirectTo);

    startTransition(async () => {
      const result = await signIn(formData);

      if (result.success) {
        toast.success("Welcome back!", "You have been signed in successfully.");
        router.push(result.redirectTo || "/");
        router.refresh();
      } else {
        setError(result.error || "Sign in failed");
      }
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || "Google sign in failed");
      }
    });
  };

  const handleGitHubSignIn = () => {
    startTransition(async () => {
      const result = await signInWithGitHub();
      if (!result.success) {
        setError(result.error || "GitHub sign in failed");
      }
    });
  };

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
          Welcome back
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Sign in to your FORGE account
        </p>
      </div>

      {/* Error Display */}
      {(error || errorMessage) && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-coral-dim border border-coral-border text-coral text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
            disabled={isPending}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-iris hover:text-iris-light"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-canvas px-2 text-text-tertiary">
            or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={handleGitHubSignIn}
          disabled={isPending}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          GitHub
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-iris hover:text-iris-light font-medium">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center lg:text-left">
        <div className="h-8 w-40 bg-surface-02 rounded" />
        <div className="h-4 w-56 bg-surface-02 rounded mt-2" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-surface-02 rounded" />
        <div className="h-10 bg-surface-02 rounded" />
        <div className="h-10 bg-surface-02 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}

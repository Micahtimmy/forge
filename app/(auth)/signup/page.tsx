"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Building2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeIn, slideUp } from "@/lib/motion/variants";
import { signUp, signInWithGoogle, signInWithGitHub } from "@/lib/auth/actions";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signUp(formData);

      if (result.success) {
        if (result.redirectTo === "/signup/verify") {
          setEmailSent(true);
        }
      } else {
        setError(result.error || "Sign up failed");
      }
    });
  };

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || "Google sign up failed");
      }
    });
  };

  const handleGitHubSignUp = () => {
    startTransition(async () => {
      const result = await signInWithGitHub();
      if (!result.success) {
        setError(result.error || "GitHub sign up failed");
      }
    });
  };

  // Show email verification sent screen
  if (emailSent) {
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
            Check your email
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            We sent a verification link to your email address. Click the link to verify your account and get started.
          </p>
        </div>
        <div className="pt-4">
          <p className="text-sm text-text-tertiary">
            Didn't receive the email?{" "}
            <button
              type="button"
              className="text-iris hover:text-iris-light font-medium"
              onClick={() => setEmailSent(false)}
            >
              Try again
            </button>
          </p>
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
          Create your account
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Get started with FORGE for free
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            leftIcon={<User className="w-4 h-4" />}
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
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
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            name="company"
            type="text"
            placeholder="Acme Inc"
            leftIcon={<Building2 className="w-4 h-4" />}
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="w-4 h-4" />}
            required
            minLength={8}
            disabled={isPending}
          />
          <p className="text-xs text-text-tertiary mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Terms */}
      <p className="text-xs text-text-tertiary text-center">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-text-secondary hover:text-text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-text-secondary hover:text-text-primary">
          Privacy Policy
        </Link>
      </p>

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
          onClick={handleGoogleSignUp}
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
          onClick={handleGitHubSignUp}
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
        Already have an account?{" "}
        <Link href="/login" className="text-iris hover:text-iris-light font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

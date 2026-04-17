"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeIn, slideUp } from "@/lib/motion/variants";
import { resetPassword } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    setEmail(emailValue);

    startTransition(async () => {
      const result = await resetPassword(formData);

      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    });
  };

  // Show email sent confirmation
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
            We sent a password reset link to <span className="font-medium text-text-primary">{email}</span>.
            Click the link in the email to reset your password.
          </p>
        </div>
        <div className="pt-4 space-y-3">
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
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
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
          Reset your password
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Enter your email and we'll send you a reset link
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
          <Label htmlFor="email">Email address</Label>
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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
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

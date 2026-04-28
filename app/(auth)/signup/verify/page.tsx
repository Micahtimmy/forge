"use client";

import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-01 border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-iris/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-iris" />
          </div>

          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Check your email
          </h1>

          <p className="text-text-secondary mb-6">
            We&apos;ve sent you a verification link. Click the link in your email to
            complete your account setup.
          </p>

          <div className="bg-surface-02 border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-text-tertiary">
              Didn&apos;t receive the email? Check your spam folder or make sure you
              entered the correct email address.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

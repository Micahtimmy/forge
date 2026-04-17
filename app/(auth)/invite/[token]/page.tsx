"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InviteDetails {
  workspaceName: string;
  inviterName: string;
  role: string;
  email: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "accepting" | "accepted" | "error">("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate invite on mount
  useEffect(() => {
    async function validateInvite() {
      try {
        const res = await fetch(`/api/team/accept?token=${token}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus("invalid");
          setError(data.error || "This invitation is invalid or has expired");
          return;
        }

        setInvite(data.invite);
        setStatus("valid");
      } catch {
        setStatus("error");
        setError("Failed to validate invitation");
      }
    }

    validateInvite();
  }, [token]);

  const handleAccept = async () => {
    setStatus("accepting");

    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Failed to accept invitation");
        return;
      }

      setStatus("accepted");

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setStatus("error");
      setError("Failed to accept invitation");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-01 border border-border rounded-xl p-8 text-center">
          {/* Loading State */}
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full bg-surface-03 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-iris animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Validating Invitation
              </h1>
              <p className="text-sm text-text-secondary">
                Please wait while we verify your invite...
              </p>
            </>
          )}

          {/* Invalid Invite */}
          {status === "invalid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-coral-dim flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-coral" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Invalid Invitation
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                {error}
              </p>
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </>
          )}

          {/* Valid Invite - Show Accept */}
          {status === "valid" && invite && (
            <>
              <div className="w-16 h-16 rounded-full bg-iris-dim flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-iris" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                You&apos;ve Been Invited
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                <span className="text-text-primary font-medium">{invite.inviterName}</span>{" "}
                has invited you to join{" "}
                <span className="text-text-primary font-medium">{invite.workspaceName}</span>{" "}
                as a <span className="text-iris font-medium">{invite.role}</span>.
              </p>
              <div className="p-3 bg-surface-02 rounded-lg mb-6">
                <p className="text-xs text-text-tertiary">Invited email</p>
                <p className="text-sm font-medium text-text-primary">{invite.email}</p>
              </div>
              <Button onClick={handleAccept} className="w-full">
                Accept Invitation
              </Button>
              <p className="text-xs text-text-tertiary mt-4">
                By accepting, you agree to our Terms of Service
              </p>
            </>
          )}

          {/* Accepting */}
          {status === "accepting" && (
            <>
              <div className="w-16 h-16 rounded-full bg-iris-dim flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-iris animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Joining Workspace
              </h1>
              <p className="text-sm text-text-secondary">
                Setting up your account...
              </p>
            </>
          )}

          {/* Accepted */}
          {status === "accepted" && (
            <>
              <div className="w-16 h-16 rounded-full bg-jade-dim flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-jade" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Welcome to the Team!
              </h1>
              <p className="text-sm text-text-secondary">
                Redirecting you to the dashboard...
              </p>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-coral-dim flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-coral" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Something Went Wrong
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                {error}
              </p>
              <Button variant="secondary" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

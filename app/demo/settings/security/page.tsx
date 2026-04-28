"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToastActions } from "@/components/ui/toast";

export default function DemoSecuritySettingsPage() {
  const [hasMFA, setHasMFA] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const toast = useToastActions();

  const handleRemoveMFA = () => {
    setHasMFA(false);
    setShowRemoveConfirm(false);
    toast.success("Two-factor authentication removed", "You can re-enable it anytime.");
  };

  const handleEnableMFA = () => {
    setHasMFA(true);
    setShowEnrollment(false);
    toast.success("Two-factor authentication enabled", "Your account is now more secure.");
  };

  return (
    <div>
      <PageHeader
        title="Security"
        description="Manage your account security and two-factor authentication"
      />

      <div className="max-w-2xl space-y-6">
        {/* MFA Section */}
        <section className="border border-border rounded-lg bg-surface-01 overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-surface-03">
                <Shield className="w-5 h-5 text-iris" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {hasMFA ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-jade" />
                  <span className="text-sm text-jade">
                    Two-factor authentication is enabled
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-02 border border-border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Authenticator App
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Added Apr 15, 2026
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-coral hover:text-coral hover:bg-coral/10"
                    onClick={() => setShowRemoveConfirm(true)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-text-secondary">
                    Two-factor authentication is not enabled
                  </span>
                </div>
                <Button onClick={() => setShowEnrollment(true)}>Enable 2FA</Button>
              </div>
            )}
          </div>
        </section>

        {/* Password Section */}
        <section className="border border-border rounded-lg bg-surface-01 overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-surface-03">
                <Key className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Password
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Change your password or set up a new one
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <Button
              variant="secondary"
              onClick={() => toast.info("Demo mode", "Password change not available in demo")}
            >
              Change Password
            </Button>
          </div>
        </section>

        {/* Active Sessions */}
        <section className="border border-border rounded-lg bg-surface-01 overflow-hidden opacity-60">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-surface-03">
                  <Smartphone className="w-5 h-5 text-text-tertiary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Active Sessions
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Manage devices logged into your account
                  </p>
                </div>
              </div>
              <span className="text-xs text-text-tertiary bg-surface-03 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* MFA Enrollment Modal */}
      <AnimatePresence>
        {showEnrollment && (
          <DemoMFAEnrollmentModal
            onClose={() => setShowEnrollment(false)}
            onSuccess={handleEnableMFA}
          />
        )}
      </AnimatePresence>

      {/* Remove MFA Confirmation */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <RemoveMFAModal
            onClose={() => setShowRemoveConfirm(false)}
            onConfirm={handleRemoveMFA}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DemoMFAEnrollmentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const toast = useToastActions();

  const demoSecret = "JBSWY3DPEHPK3PXP";
  const demoQRCode = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PHJlY3QgZmlsbD0iI2ZmZiIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6TTYwIDIwaDIwdjIwSDYwek04MCAyMGgyMHYyMEg4MHpNMTAwIDIwaDIwdjIwSDEwMHpNMTQwIDIwaDIwdjIwSDE0MHpNMjAgNDBoMjB2MjBIMjB6TTYwIDQwaDIwdjIwSDYwek0xNDAgNDBoMjB2MjBIMTQwek0yMCA2MGgyMHYyMEgyMHpNNjAgNjBoMjB2MjBINjB6TTEwMCA2MGgyMHYyMEgxMDB6TTE0MCA2MGgyMHYyMEgxNDB6TTIwIDgwaDIwdjIwSDIwek00MCA4MGgyMHYyMEg0MHpNNjAgODBoMjB2MjBINjB6TTgwIDgwaDIwdjIwSDgwek0xMDAgODBoMjB2MjBIMTAwek0xMjAgODBoMjB2MjBIMTIwek0xNDAgODBoMjB2MjBIMTQwek0yMCAxMDBoMjB2MjBIMjB6TTYwIDEwMGgyMHYyMEg2MHpNMTAwIDEwMGgyMHYyMEgxMDB6TTE0MCAxMDBoMjB2MjBIMTQwek0yMCAxMjBoMjB2MjBIMjB6TTQwIDEyMGgyMHYyMEg0MHpNNjAgMTIwaDIwdjIwSDYwek04MCAxMjBoMjB2MjBIODB6TTEwMCAxMjBoMjB2MjBIMTAwek0xMjAgMTIwaDIwdjIwSDEyMHpNMTQwIDEyMGgyMHYyMEgxNDB6TTIwIDE0MGgyMHYyMEgyMHpNNjAgMTQwaDIwdjIwSDYwek0xNDAgMTQwaDIwdjIwSDE0MHoiIGZpbGw9IiMwMDAiLz48L3N2Zz4=";

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (code === "123456" || code.length === 6) {
      onSuccess();
    } else {
      toast.error("Invalid code", "Please enter a valid 6-digit code");
    }
    setIsVerifying(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(demoSecret);
    toast.success("Secret copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-surface-01 border border-border rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Set Up Two-Factor Authentication
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-03 transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Scan QR */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <span className="w-5 h-5 rounded-full bg-iris text-white flex items-center justify-center text-xs">
                1
              </span>
              Scan this QR code with your authenticator app
            </div>
            <div className="bg-white p-4 rounded-lg w-fit mx-auto">
              <img src={demoQRCode} alt="MFA QR Code" width={180} height={180} />
            </div>
            <p className="text-xs text-text-tertiary text-center">
              Use Google Authenticator, Authy, or any TOTP app
            </p>
          </div>

          {/* Manual entry option */}
          <div className="space-y-2">
            <p className="text-xs text-text-tertiary text-center">
              Or enter this code manually:
            </p>
            <div className="flex items-center gap-2 p-2 bg-surface-02 rounded-md">
              <code className="flex-1 text-xs font-mono text-text-secondary break-all">
                {demoSecret}
              </code>
              <button
                onClick={copySecret}
                className="p-1.5 hover:bg-surface-03 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-text-tertiary" />
              </button>
            </div>
          </div>

          {/* Step 2: Enter code */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <span className="w-5 h-5 rounded-full bg-iris text-white flex items-center justify-center text-xs">
                2
              </span>
              Enter the 6-digit code from your app
            </div>
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
                "w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em]",
                "bg-surface-02 border border-border rounded-lg",
                "text-text-primary placeholder:text-text-tertiary",
                "focus:outline-none focus:ring-2 focus:ring-iris/50 focus:border-iris"
              )}
              autoFocus
            />
            <p className="text-xs text-text-tertiary text-center">
              Demo: Enter any 6 digits to continue
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Verify & Enable"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RemoveMFAModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onConfirm();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-surface-01 border border-border rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-coral" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary text-center mb-2">
            Remove Two-Factor Authentication?
          </h2>
          <p className="text-sm text-text-secondary text-center">
            This will make your account less secure. You can always re-enable it
            later.
          </p>
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Keep Enabled
          </Button>
          <Button
            variant="danger"
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex-1"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Remove 2FA"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

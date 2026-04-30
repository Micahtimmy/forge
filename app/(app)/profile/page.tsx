"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  Globe,
  Bell,
  Lock,
  Trash2,
  Camera,
  Save,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalFooter, ConfirmDialog } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToastActions } from "@/components/ui/toast";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-xl p-6"
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export default function ProfilePage() {
  const toast = useToastActions();
  const { data: user, isLoading, refetch } = useUser();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [scoreAlerts, setScoreAlerts] = useState(true);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setJobTitle(user.jobTitle || "");
      setTimezone(user.timezone || "UTC");
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const changed =
        displayName !== (user.displayName || "") ||
        jobTitle !== (user.jobTitle || "") ||
        timezone !== (user.timezone || "UTC");
      setHasChanges(changed);
    }
  }, [displayName, jobTitle, timezone, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          jobTitle,
          timezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      await refetch();
      toast.success("Profile updated", "Your changes have been saved");
      setHasChanges(false);
    } catch (err) {
      toast.error("Failed to save", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          weeklyDigest,
          scoreAlerts,
        }),
      });
      toast.success("Preferences saved");
    } catch (err) {
      toast.error("Failed to save preferences");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", "Please confirm your new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password too short", "Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed", "Your password has been updated");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Failed to change password", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      toast.error("Email doesn't match", "Please enter your email correctly to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteConfirmEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Redirect to home after deletion
      window.location.href = "/";
    } catch (err) {
      toast.error("Failed to delete account", err instanceof Error ? err.message : "Unknown error");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Profile" description="Manage your account settings" />
        <div className="max-w-2xl space-y-6">
          <div className="bg-surface-01 border border-border rounded-xl p-6">
            <div className="flex items-center gap-6 mb-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account settings and preferences"
        actions={
          hasChanges && (
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          )
        }
      />

      <motion.div
        className="max-w-2xl space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Info */}
        <ProfileSection title="Profile Information">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <Avatar
                src={user?.avatarUrl || undefined}
                alt={user?.displayName || "User"}
                size="xl"
              />
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-surface-03 border border-border text-text-tertiary hover:text-text-primary transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-text-primary">
                {user?.displayName || "User"}
              </div>
              <div className="text-sm text-text-secondary">{user?.email}</div>
              {user?.role && (
                <Badge variant="default" className="mt-2">
                  {user.role === "sm"
                    ? "Scrum Master"
                    : user.role === "pm"
                    ? "Product Manager"
                    : user.role === "rte"
                    ? "RTE"
                    : user.role === "pgm"
                    ? "Program Manager"
                    : user.role}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Scrum Master"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <p className="text-xs text-text-tertiary mt-1">
                Email changes require verification. Contact support to update.
              </p>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ProfileSection>

        {/* Notification Preferences */}
        <ProfileSection
          title="Notifications"
          description="Choose how you want to be notified"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Email Notifications
                </div>
                <div className="text-xs text-text-secondary">
                  Receive emails about important updates
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                  handleSaveNotifications();
                }}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Weekly Digest
                </div>
                <div className="text-xs text-text-secondary">
                  Get a weekly summary of your team's progress
                </div>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={(checked) => {
                  setWeeklyDigest(checked);
                  handleSaveNotifications();
                }}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Quality Score Alerts
                </div>
                <div className="text-xs text-text-secondary">
                  Get notified when stories score below threshold
                </div>
              </div>
              <Switch
                checked={scoreAlerts}
                onCheckedChange={(checked) => {
                  setScoreAlerts(checked);
                  handleSaveNotifications();
                }}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Security */}
        <ProfileSection
          title="Security"
          description="Manage your password and security settings"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Password</div>
              <div className="text-xs text-text-secondary">
                Last changed: Never
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              <Lock className="w-4 h-4 mr-1" />
              Change Password
            </Button>
          </div>
        </ProfileSection>

        {/* Danger Zone */}
        <ProfileSection title="Danger Zone">
          <div className="p-4 rounded-lg bg-coral-dim/20 border border-coral/30">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-coral mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-coral">Delete Account</div>
                <p className="text-xs text-text-secondary mt-1">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </ProfileSection>
      </motion.div>

      {/* Change Password Modal */}
      <Modal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Must be at least 8 characters
            </p>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            isLoading={isChangingPassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            <Check className="w-4 h-4 mr-1" />
            Update Password
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Account"
        description="This action is permanent and cannot be undone"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-coral-dim border border-coral/30 text-coral text-sm">
            <strong>Warning:</strong> Deleting your account will permanently
            remove all your data, including workspaces, stories, and settings.
          </div>
          <div>
            <Label htmlFor="confirmEmail">
              Type your email ({user?.email}) to confirm
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Enter your email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
            disabled={deleteConfirmEmail !== user?.email}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Account
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

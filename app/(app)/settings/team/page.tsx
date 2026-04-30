"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  UserCog,
  Trash2,
  Clock,
  AlertCircle,
  UserPlus,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ModalFooter, ConfirmDialog } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToastActions } from "@/components/ui/toast";
import {
  useTeamMembers,
  useUpdateMemberRole,
  useRemoveMember,
  type TeamMember,
} from "@/hooks/use-team";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

type Role = "owner" | "admin" | "member" | "viewer";

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

const roleConfig: Record<Role, { label: string; description: string; color: string; badgeVariant: "excellent" | "good" | "fair" | "default" }> = {
  owner: {
    label: "Owner",
    description: "Full access, can manage billing and delete workspace",
    color: "text-iris",
    badgeVariant: "excellent",
  },
  admin: {
    label: "Admin",
    description: "Can manage members, integrations, and settings",
    color: "text-jade",
    badgeVariant: "good",
  },
  member: {
    label: "Member",
    description: "Full product access, no billing or team settings",
    color: "text-sky",
    badgeVariant: "fair",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access, cannot trigger AI actions",
    color: "text-amber",
    badgeVariant: "default",
  },
};

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-01 border border-border rounded-lg p-4">
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-surface-01 border border-border rounded-lg overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-02">
          <Skeleton className="h-4 w-20" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mx-auto mb-4">
        <UserPlus className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No Team Members Yet
      </h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
        You're the only one here. Invite team members to collaborate on story
        scoring, stakeholder updates, and PI planning.
      </p>
      <Button onClick={onInvite}>
        <Plus className="w-4 h-4 mr-1" />
        Invite Your First Team Member
      </Button>
    </div>
  );
}

function MemberRow({
  member,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onRemove,
  isUpdating,
  isRemoving,
}: {
  member: TeamMember;
  currentUserId: string;
  currentUserRole: Role;
  onUpdateRole: (role: Role) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}) {
  const isCurrentUser = member.userId === currentUserId;
  const canManage = (currentUserRole === "owner" || currentUserRole === "admin") && !isCurrentUser;
  const canChangeRole = canManage && member.role !== "owner";

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-center gap-4 p-4 border-b border-border last:border-b-0",
        "hover:bg-surface-02 transition-colors",
        isCurrentUser && "bg-iris-dim/20"
      )}
    >
      <Avatar
        src={member.avatarUrl || undefined}
        alt={member.name}
        status="online"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {member.name}
          </span>
          {isCurrentUser && (
            <Badge variant="iris" size="sm">
              You
            </Badge>
          )}
        </div>
        <div className="text-xs text-text-secondary truncate">{member.email}</div>
      </div>
      <div className="hidden sm:block text-xs text-text-tertiary">
        Joined {formatDate(member.joinedAt)}
      </div>
      {canChangeRole ? (
        <Select
          value={member.role}
          onValueChange={(value) => onUpdateRole(value as Role)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-28">
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][])
              .filter(([role]) => role !== "owner")
              .map(([role, config]) => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full bg-current", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant={roleConfig[member.role].badgeVariant}>
          {roleConfig[member.role].label}
        </Badge>
      )}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserCog className="w-4 h-4 mr-2" />
              View Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRemove}
              className="text-coral"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}

function PendingInviteRow({
  invite,
  onResend,
  onCancel,
}: {
  invite: PendingInvite;
  onResend: () => void;
  onCancel: () => void;
}) {
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-surface-02 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-surface-03 flex items-center justify-center">
        <Mail className="w-5 h-5 text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {invite.email}
          </span>
          <Badge variant="fair" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        </div>
        <div className="text-xs text-text-tertiary">
          Invited {formatDate(invite.createdAt)} as {roleConfig[invite.role].label}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onResend}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Resend
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-coral hover:text-coral">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

export default function TeamSettingsPage() {
  const toast = useToastActions();
  const { data: currentUser } = useUser();
  const { data: members, isLoading, error, refetch } = useTeamMembers();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const currentUserRole = (currentUser?.role as Role) || "member";

  const filteredMembers = (members || []).filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
      toast.error("Invalid email", "Please enter a valid email address");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invite");
      }

      const newInvite: PendingInvite = {
        id: `invite-${Date.now()}`,
        email: inviteEmail,
        role: inviteRole,
        createdAt: new Date().toISOString(),
      };

      setPendingInvites([...pendingInvites, newInvite]);
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteMessage("");
      toast.success("Invitation sent", `Invite sent to ${inviteEmail}`);
    } catch (err) {
      toast.error("Failed to send invite", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: Role) => {
    setUpdatingMemberId(memberId);
    try {
      await updateRole.mutateAsync({ memberId, role: role as "admin" | "member" | "viewer" });
      toast.success("Role updated");
    } catch (err) {
      toast.error("Failed to update role", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemovingMemberId(memberToRemove.id);
    try {
      await removeMember.mutateAsync({ memberId: memberToRemove.id });
      toast.success("Member removed", `${memberToRemove.name} has been removed from the workspace`);
      setMemberToRemove(null);
    } catch (err) {
      toast.error("Failed to remove member", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleResendInvite = async (invite: PendingInvite) => {
    try {
      await fetch("/api/team/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email }),
      });
      toast.success("Invite resent", `Invitation resent to ${invite.email}`);
    } catch (err) {
      toast.error("Failed to resend", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleCancelInvite = (inviteId: string) => {
    setPendingInvites(pendingInvites.filter((i) => i.id !== inviteId));
    toast.success("Invite cancelled");
  };

  const activeCount = (members || []).length;
  const pendingCount = pendingInvites.length;
  const adminCount = (members || []).filter((m) => m.role === "admin" || m.role === "owner").length;

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Team Members"
          description="Manage who has access to this workspace"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Team Members"
          description="Manage who has access to this workspace"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-primary font-medium mb-2">Failed to Load Team</p>
          <p className="text-text-secondary text-sm mb-4">
            {error instanceof Error ? error.message : "Please check your connection"}
          </p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Manage who has access to this workspace"
        actions={
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Invite Member
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {activeCount}
          </div>
          <div className="text-sm text-text-secondary">Active Members</div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {pendingCount}
          </div>
          <div className="text-sm text-text-secondary">Pending Invites</div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {adminCount}
          </div>
          <div className="text-sm text-text-secondary">Administrators</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="max-w-xs"
        />
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-surface-01 border border-amber/30 rounded-lg overflow-hidden mb-4">
          <div className="p-3 border-b border-border bg-amber-dim">
            <span className="text-xs font-medium text-amber uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Pending Invitations ({pendingCount})
            </span>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {pendingInvites.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                invite={invite}
                onResend={() => handleResendInvite(invite)}
                onCancel={() => handleCancelInvite(invite.id)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Members List */}
      {!members || members.length === 0 ? (
        <EmptyState onInvite={() => setIsInviteModalOpen(true)} />
      ) : (
        <div className="bg-surface-01 border border-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-border bg-surface-02">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              {filteredMembers.length} Member{filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No members match your search</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserId={currentUser?.id || ""}
                  currentUserRole={currentUserRole}
                  onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                  onRemove={() => setMemberToRemove(member)}
                  isUpdating={updatingMemberId === member.id}
                  isRemoving={removingMemberId === member.id}
                />
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Role Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([role, config]) => (
          <div
            key={role}
            className="p-3 bg-surface-01 border border-border rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className={cn("w-4 h-4", config.color)} />
              <span className="text-sm font-medium text-text-primary">
                {config.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      <Modal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        title="Invite Team Member"
        description="Send an invitation to join this workspace"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][])
                  .filter(([role]) => role !== "owner")
                  .map(([role, config]) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex flex-col">
                        <span>{config.label}</span>
                        <span className="text-xs text-text-tertiary">
                          {config.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="invite-message">Personal Message (Optional)</Label>
            <Textarea
              id="invite-message"
              placeholder="Add a personal note to the invitation..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!inviteEmail} isLoading={isInviting}>
            <Mail className="w-4 h-4 mr-1" />
            Send Invite
          </Button>
        </ModalFooter>
      </Modal>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Team Member?"
        description={
          memberToRemove
            ? `Are you sure you want to remove ${memberToRemove.name} from this workspace? This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}

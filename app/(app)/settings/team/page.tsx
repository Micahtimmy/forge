"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ModalFooter } from "@/components/ui/modal";
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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

type Role = "owner" | "admin" | "member" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "pending" | "deactivated";
  joinedAt: string;
  lastActive: string;
}

// Mock data
const mockMembers: TeamMember[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@company.com",
    role: "owner",
    status: "active",
    joinedAt: "2025-06-15T00:00:00Z",
    lastActive: "2026-04-17T10:30:00Z",
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@company.com",
    role: "admin",
    status: "active",
    joinedAt: "2025-08-20T00:00:00Z",
    lastActive: "2026-04-17T09:15:00Z",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "member",
    status: "active",
    joinedAt: "2025-11-01T00:00:00Z",
    lastActive: "2026-04-16T16:45:00Z",
  },
  {
    id: "4",
    name: "Mike Chen",
    email: "mike@company.com",
    role: "member",
    status: "active",
    joinedAt: "2026-01-10T00:00:00Z",
    lastActive: "2026-04-15T11:00:00Z",
  },
  {
    id: "5",
    name: "Emily Brown",
    email: "emily@company.com",
    role: "viewer",
    status: "pending",
    joinedAt: "2026-04-10T00:00:00Z",
    lastActive: "2026-04-10T00:00:00Z",
  },
];

const roleConfig: Record<Role, { label: string; description: string; color: string }> = {
  owner: {
    label: "Owner",
    description: "Full access, can manage billing and delete workspace",
    color: "bg-iris-dim text-iris",
  },
  admin: {
    label: "Admin",
    description: "Can manage members, integrations, and settings",
    color: "bg-jade-dim text-jade",
  },
  member: {
    label: "Member",
    description: "Can view and contribute to all modules",
    color: "bg-sky-dim text-sky",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to dashboards and reports",
    color: "bg-amber-dim text-amber",
  },
};

function MemberRow({
  member,
  onUpdateRole,
  onRemove,
  onResendInvite,
}: {
  member: TeamMember;
  onUpdateRole: (role: Role) => void;
  onRemove: () => void;
  onResendInvite: () => void;
}) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Memoize current time to avoid React Compiler purity issues
  const now = useMemo(() => Date.now(), []);

  const formatLastActive = (date: string) => {
    const diff = now - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-surface-02 transition-colors"
    >
      <Avatar alt={member.name} status={member.status === "active" ? "online" : undefined} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {member.name}
          </span>
          {member.status === "pending" && (
            <Badge variant="fair" size="sm">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
        <div className="text-xs text-text-secondary truncate">{member.email}</div>
      </div>
      <div className="hidden sm:block text-xs text-text-tertiary">
        {member.status === "pending" ? (
          <span>Invited {formatDate(member.joinedAt)}</span>
        ) : (
          <span>Active {formatLastActive(member.lastActive)}</span>
        )}
      </div>
      <Select
        value={member.role}
        onValueChange={(value) => onUpdateRole(value as Role)}
        disabled={member.role === "owner"}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleConfig).map(([role, config]) => (
            <SelectItem key={role} value={role} disabled={role === "owner"}>
              <div className="flex items-center gap-2">
                <span
                  className={cn("w-2 h-2 rounded-full", config.color.split(" ")[0])}
                />
                {config.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {member.status === "pending" && (
            <DropdownMenuItem onClick={onResendInvite}>
              <Mail className="w-4 h-4 mr-2" />
              Resend Invite
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <UserCog className="w-4 h-4 mr-2" />
            View Activity
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onRemove}
            className="text-coral"
            disabled={member.role === "owner"}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {member.status === "pending" ? "Cancel Invite" : "Remove Member"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export default function TeamSettingsPage() {
  const toast = useToastActions();
  const [members, setMembers] = useState(mockMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = () => {
    if (!inviteEmail.includes("@")) {
      toast.error("Invalid email", "Please enter a valid email address");
      return;
    }

    const newMember: TeamMember = {
      id: `new-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    setMembers([...members, newMember]);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("member");
    toast.success("Invitation sent", `Invite sent to ${inviteEmail}`);
  };

  const handleUpdateRole = (memberId: string, role: Role) => {
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
    toast.success("Role updated");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    toast.success("Member removed");
  };

  const handleResendInvite = (member: TeamMember) => {
    toast.success("Invite resent", `Invitation resent to ${member.email}`);
  };

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
            {members.filter((m) => m.status === "active").length}
          </div>
          <div className="text-sm text-text-secondary">Active Members</div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {members.filter((m) => m.status === "pending").length}
          </div>
          <div className="text-sm text-text-secondary">Pending Invites</div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {members.filter((m) => m.role === "admin" || m.role === "owner").length}
          </div>
          <div className="text-sm text-text-secondary">Admins</div>
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

      {/* Members List */}
      <div className="bg-surface-01 border border-border rounded-lg overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-02">
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            {filteredMembers.length} Members
          </span>
        </div>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No members found</p>
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
                onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                onRemove={() => handleRemoveMember(member.id)}
                onResendInvite={() => handleResendInvite(member)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Role Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => (
          <div
            key={role}
            className="p-3 bg-surface-01 border border-border rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className={cn("w-4 h-4", config.color.split(" ")[1])} />
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
                {Object.entries(roleConfig)
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
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!inviteEmail}>
            <Mail className="w-4 h-4 mr-1" />
            Send Invite
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

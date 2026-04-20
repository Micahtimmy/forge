"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Users,
  Link2,
  CreditCard,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { DEMO_TEAM } from "@/lib/demo/mock-data";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function DemoSettingsPage() {
  const toast = useToastActions();
  const [activeSection, setActiveSection] = useState("profile");

  const handleSave = () => {
    toast.success("Settings saved", "Your changes have been saved");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and workspace settings"
      />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    activeSection === section.id
                      ? "bg-iris-dim text-iris"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-02"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeSection === "profile" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label>Display Name</Label>
                  <Input defaultValue="Demo User" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue="demo@forge.app" disabled />
                  <p className="text-xs text-text-tertiary mt-1">
                    Email cannot be changed in demo mode
                  </p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Input defaultValue="Scrum Master" disabled />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "workspace" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Workspace</h2>
              <div className="space-y-4">
                <div>
                  <Label>Workspace Name</Label>
                  <Input defaultValue="Acme Engineering" />
                </div>
                <div>
                  <Label>Workspace URL</Label>
                  <Input defaultValue="acme-engineering" disabled />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "team" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Team Members</h2>
                <Button size="sm">Invite Member</Button>
              </div>
              <div className="space-y-3">
                {DEMO_TEAM.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-surface-02 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-03 flex items-center justify-center">
                        <span className="text-xs font-medium text-text-secondary">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{member.name}</div>
                        <div className="text-xs text-text-tertiary">{member.email}</div>
                      </div>
                    </div>
                    <Badge variant="default">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="space-y-4">
              <div className="bg-surface-01 border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0052CC] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">J</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">JIRA</h3>
                      <p className="text-sm text-text-secondary">Sync stories and sprints</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-jade" />
                    <Badge variant="excellent">Connected</Badge>
                  </div>
                </div>
                <div className="text-sm text-text-tertiary">
                  Connected to: acme-engineering.atlassian.net
                </div>
              </div>

              <div className="bg-surface-01 border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">Slack</h3>
                      <p className="text-sm text-text-secondary">Send updates to channels</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Connect</Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Billing</h2>
              <div className="bg-iris-dim border border-iris/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text-primary">Pro Plan</div>
                    <div className="text-sm text-text-secondary">$29/month per user</div>
                  </div>
                  <Badge variant="good">Active</Badge>
                </div>
              </div>
              <div className="text-sm text-text-tertiary mb-4">
                Next billing date: May 1, 2026
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">Change Plan</Button>
                <Button variant="ghost">View Invoices</Button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Notifications</h2>
              <div className="space-y-4">
                {[
                  { label: "Sprint scored", description: "When AI completes sprint scoring", enabled: true },
                  { label: "Story at risk", description: "When a story falls below threshold", enabled: true },
                  { label: "JIRA sync complete", description: "After each sync with JIRA", enabled: false },
                  { label: "Team updates", description: "When teammates send updates", enabled: true },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{pref.label}</div>
                      <div className="text-xs text-text-tertiary">{pref.description}</div>
                    </div>
                    <button
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        pref.enabled ? "bg-iris" : "bg-surface-03"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          pref.enabled ? "left-5" : "left-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="bg-surface-01 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Security</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Two-Factor Authentication</div>
                    <div className="text-xs text-text-tertiary">Add an extra layer of security</div>
                  </div>
                  <Button variant="secondary" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Active Sessions</div>
                    <div className="text-xs text-text-tertiary">Manage your logged-in devices</div>
                  </div>
                  <Badge variant="default">2 devices</Badge>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-text-primary">API Keys</div>
                    <div className="text-xs text-text-tertiary">Manage API access tokens</div>
                  </div>
                  <Button variant="secondary" size="sm">Manage</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Copy,
  Check,
  Calendar,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToastActions } from "@/components/ui/toast";
import { DEMO_UPDATES } from "@/lib/demo/mock-data";
import { audienceLabels } from "@/types/signal";
import { useState } from "react";
import { format } from "date-fns";

export default function DemoSignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToastActions();
  const [copied, setCopied] = useState(false);

  const update = DEMO_UPDATES.find((u) => u.id === id);

  if (!update) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Update not found</p>
        <Link href="/demo/signal">
          <Button variant="secondary" className="mt-4">
            Back to Signal
          </Button>
        </Link>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(update.content);
    setCopied(true);
    toast.success("Copied", "Update content copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link href="/demo/signal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-text-primary">{update.title}</span>
            <Badge
              variant={update.status === "sent" ? "excellent" : "fair"}
            >
              {update.status}
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            {update.status === "draft" && (
              <Button size="sm" leftIcon={<Mail className="w-4 h-4" />}>
                Send Update
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-01 border border-border rounded-lg p-6"
          >
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
              {update.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold text-text-primary mt-6 mb-3">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-md font-medium text-text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-semibold text-text-primary mb-2">{line.replace(/\*\*/g, '')}</p>;
                }
                if (line.startsWith('- ') || line.startsWith('1. ')) {
                  return <p key={i} className="text-text-secondary ml-4 mb-1">{line}</p>;
                }
                if (line.startsWith('|')) {
                  return <p key={i} className="font-mono text-xs text-text-tertiary mb-1">{line}</p>;
                }
                if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i} className="text-text-secondary mb-2">{line}</p>;
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Metadata */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-text-tertiary" />
                <div>
                  <div className="text-xs text-text-tertiary">Author</div>
                  <div className="flex items-center gap-2">
                    <Avatar size="xs" alt={update.authorName} />
                    <span className="text-sm text-text-primary">{update.authorName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <div>
                  <div className="text-xs text-text-tertiary">
                    {update.sentAt ? "Sent" : "Created"}
                  </div>
                  <div className="text-sm text-text-primary">
                    {format(
                      new Date(update.sentAt || update.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-text-tertiary mt-0.5" />
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Audiences</div>
                  <div className="flex flex-wrap gap-1">
                    {update.audiences.map((audience) => (
                      <Badge key={audience} variant="default" size="sm">
                        {audienceLabels[audience]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sprint Context */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Context</h3>
            <div className="text-sm">
              <div className="text-text-tertiary">Sprint Reference</div>
              <div className="text-text-primary font-medium">{update.sprintRef}</div>
            </div>
          </div>

          {/* Actions */}
          {update.status === "sent" && (
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full">
                  Resend to Audience
                </Button>
                <Button variant="ghost" className="w-full">
                  Create Follow-up
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

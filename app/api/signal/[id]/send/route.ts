import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getSignalUpdateById,
  updateSignalStatus,
} from "@/lib/db/queries/signals";
import {
  sendEmail,
  getSignalUpdateEmailHtml,
  getSignalUpdateEmailText,
} from "@/lib/email/resend";
import type { AudienceType } from "@/types/signal";

const sendSchema = z.object({
  audiences: z.array(z.enum(["executive", "team", "client", "board"])).min(1),
  channels: z.array(z.enum(["email", "slack"])).min(1),
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        audience: z.enum(["executive", "team", "client", "board"]),
      })
    )
    .max(100), // Limit recipients per request
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    // Rate limiting to prevent email abuse
    const rateLimit = checkRateLimit(
      req,
      auth.context.user.id,
      RATE_LIMITS.emailSend
    );
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { id: updateId } = await params;
    const { workspaceId, user } = auth.context;
    const body = await req.json();
    const validated = sendSchema.parse(body);

    // Fetch the update with drafts
    const update = await getSignalUpdateById(workspaceId, updateId);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    if (update.drafts.length === 0) {
      return NextResponse.json(
        { error: "No drafts to send. Generate content first." },
        { status: 400 }
      );
    }

    const results: {
      audience: AudienceType;
      channel: string;
      success: boolean;
      error?: string;
      emailId?: string;
    }[] = [];

    // Process email channel
    if (validated.channels.includes("email")) {
      for (const audience of validated.audiences) {
        const draft = update.drafts.find((d) => d.audience === audience);
        if (!draft) {
          results.push({
            audience,
            channel: "email",
            success: false,
            error: `No draft found for ${audience} audience`,
          });
          continue;
        }

        // Get recipients for this audience
        const audienceRecipients = validated.recipients?.filter(
          (r) => r.audience === audience
        );

        if (!audienceRecipients || audienceRecipients.length === 0) {
          results.push({
            audience,
            channel: "email",
            success: false,
            error: `No recipients specified for ${audience} audience`,
          });
          continue;
        }

        // Send to each recipient
        for (const recipient of audienceRecipients) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://forge.dev";
          const viewUrl = `${appUrl}/signal/${updateId}`;

          const emailResult = await sendEmail({
            to: recipient.email,
            subject: `Program Update: ${update.sprintRef || "Sprint Update"}`,
            html: getSignalUpdateEmailHtml({
              recipientName: recipient.name || "Team Member",
              updateTitle: update.sprintRef || "Sprint Update",
              updatePreview: draft.content.slice(0, 500) + (draft.content.length > 500 ? "..." : ""),
              viewUrl,
            }),
            text: getSignalUpdateEmailText({
              recipientName: recipient.name || "Team Member",
              updateTitle: update.sprintRef || "Sprint Update",
              updatePreview: draft.content.slice(0, 500) + (draft.content.length > 500 ? "..." : ""),
              viewUrl,
            }),
          });

          if (emailResult.success) {
            results.push({
              audience,
              channel: "email",
              success: true,
              emailId: emailResult.messageId,
            });
          } else {
            results.push({
              audience,
              channel: "email",
              success: false,
              error: emailResult.error,
            });
          }
        }
      }
    }

    // Process Slack channel (placeholder for future implementation)
    if (validated.channels.includes("slack")) {
      for (const audience of validated.audiences) {
        results.push({
          audience,
          channel: "slack",
          success: false,
          error: "Slack integration not yet implemented",
        });
      }
    }

    // Check if at least one send was successful
    const anySuccess = results.some((r) => r.success);
    if (anySuccess) {
      // Update the signal status to "sent"
      await updateSignalStatus(workspaceId, updateId, "sent");
    }

    return NextResponse.json({
      success: anySuccess,
      results,
      sentAt: anySuccess ? new Date().toISOString() : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    Sentry.captureException(error, {
      tags: { module: "signal", operation: "send-update" },
    });

    console.error("Send signal update API error:", error);
    return NextResponse.json(
      { error: "Failed to send update" },
      { status: 500 }
    );
  }
}

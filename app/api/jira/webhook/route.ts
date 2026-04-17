import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processJiraWebhook } from "@/lib/jira/sync";
import type { JiraWebhookEvent } from "@/types/jira";
import crypto from "crypto";

// Verify webhook signature (Atlassian uses shared secret)
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Handle JIRA webhook events
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-atlassian-webhook-signature");
    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event: JiraWebhookEvent = JSON.parse(rawBody);

    // Get workspace ID from webhook registration or cloud ID header
    // In production, you'd map the cloud ID to workspace
    const cloudId = req.headers.get("x-atlassian-cloud-id");

    if (!cloudId) {
      // Try to get from URL params as fallback
      const workspaceId = req.nextUrl.searchParams.get("workspace_id");
      if (!workspaceId) {
        return NextResponse.json(
          { error: "Missing workspace identifier" },
          { status: 400 }
        );
      }

      await processJiraWebhook(workspaceId, event);
      return NextResponse.json({ received: true });
    }

    // Look up workspace by cloud ID
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: connection } = await supabase
      .from("jira_connections")
      .select("workspace_id")
      .eq("cloud_id", cloudId)
      .single();

    if (!connection) {
      console.warn(`No workspace found for cloud ID: ${cloudId}`);
      return NextResponse.json({ received: true, processed: false });
    }

    // Process the webhook event
    await processJiraWebhook(connection.workspace_id, event);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("JIRA webhook error:", error);
    // Return 200 to prevent webhook retries for parsing errors
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}

// Atlassian sends a GET request to verify the webhook endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "active" });
}

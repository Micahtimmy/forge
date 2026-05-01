import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { upsertSignalDraft } from "@/lib/db/queries/signals";

const saveDraftSchema = z.object({
  updateId: z.string().uuid(),
  audience: z.enum(["executive", "team", "client", "board"]),
  content: z.string().min(1).max(50000),
  tone: z.number().min(1).max(5),
  aiGenerated: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const body = await req.json();
    const validated = saveDraftSchema.parse(body);

    // Pass workspace ID for ownership verification
    const draft = await upsertSignalDraft(
      auth.context.workspaceId,
      validated.updateId,
      validated.audience,
      validated.content,
      validated.tone,
      validated.aiGenerated
    );

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        updateId: draft.updateId,
        audience: draft.audience,
        content: draft.content,
        tone: draft.tone,
        aiGenerated: draft.aiGenerated,
        editedAt: draft.editedAt?.toISOString() || null,
        createdAt: draft.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Save draft API error:", error);
    Sentry.captureException(error, {
      tags: { api: "signal-drafts" },
    });
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}
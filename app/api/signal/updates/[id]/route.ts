import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import {
  getSignalUpdateById,
  updateSignalStatus,
  deleteSignalUpdate,
} from "@/lib/db/queries/signals";

const updateStatusSchema = z.object({
  status: z.enum(["draft", "sent", "archived"]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;

    const update = await getSignalUpdateById(workspaceId, id);

    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: update.id,
      sprintRef: update.sprintRef,
      status: update.status,
      authorId: update.authorId,
      sentAt: update.sentAt?.toISOString() || null,
      createdAt: update.createdAt.toISOString(),
      updatedAt: update.updatedAt.toISOString(),
      drafts: update.drafts.map((draft) => ({
        id: draft.id,
        audience: draft.audience,
        content: draft.content,
        tone: draft.tone,
        aiGenerated: draft.aiGenerated,
        editedAt: draft.editedAt?.toISOString() || null,
        createdAt: draft.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Signal update API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch update" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    await updateSignalStatus(workspaceId, id, validated.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update signal status API error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;

    await deleteSignalUpdate(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete signal update API error:", error);
    return NextResponse.json(
      { error: "Failed to delete update" },
      { status: 500 }
    );
  }
}

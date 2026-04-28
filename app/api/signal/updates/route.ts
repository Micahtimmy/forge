import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import {
  getSignalUpdates,
  createSignalUpdate,
} from "@/lib/db/queries/signals";

const createUpdateSchema = z.object({
  sprintRef: z.string().min(1).max(200),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") as
      | "draft"
      | "sent"
      | "archived"
      | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const updates = await getSignalUpdates(workspaceId, {
      status: status || undefined,
      limit,
      offset,
    });

    const formattedUpdates = updates.map((update) => ({
      id: update.id,
      sprintRef: update.sprintRef,
      status: update.status,
      authorId: update.authorId,
      sentAt: update.sentAt?.toISOString() || null,
      createdAt: update.createdAt.toISOString(),
      updatedAt: update.updatedAt.toISOString(),
    }));

    return NextResponse.json({ updates: formattedUpdates });
  } catch (error) {
    console.error("Signal updates API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId, user } = auth.context;
    const body = await req.json();
    const validated = createUpdateSchema.parse(body);

    const update = await createSignalUpdate(
      workspaceId,
      user.id,
      validated.sprintRef
    );

    return NextResponse.json({
      success: true,
      update: {
        id: update.id,
        sprintRef: update.sprintRef,
        status: update.status,
        authorId: update.authorId,
        createdAt: update.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create signal update API error:", error);
    return NextResponse.json(
      { error: "Failed to create update" },
      { status: 500 }
    );
  }
}

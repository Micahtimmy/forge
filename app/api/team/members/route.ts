import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import {
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
} from "@/lib/db/queries/team";

/**
 * GET /api/team/members
 * List all members of the current workspace
 */
export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const members = await getWorkspaceMembers(auth.context.workspaceId);

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        email: m.user.email,
        name: m.user.displayName || m.user.fullName || m.user.email,
        avatarUrl: m.user.avatarUrl,
      })),
    });
  } catch (error) {
    console.error("[API] Get team members error:", error);
    Sentry.captureException(error, { tags: { api: "team-members-get" } });
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

const updateMemberSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]),
});

/**
 * PATCH /api/team/members
 * Update a member's role
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    // Only admins and owners can change roles
    if (!["owner", "admin"].includes(auth.context.role)) {
      return NextResponse.json(
        { error: "Only admins can update member roles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = updateMemberSchema.parse(body);

    await updateMemberRole(
      auth.context.workspaceId,
      validated.memberId,
      validated.role
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot change owner")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("[API] Update member role error:", error);
    Sentry.captureException(error, { tags: { api: "team-members-update" } });
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

const deleteMemberSchema = z.object({
  memberId: z.string().uuid(),
});

/**
 * DELETE /api/team/members
 * Remove a member from the workspace
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    // Only admins and owners can remove members
    if (!["owner", "admin"].includes(auth.context.role)) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = deleteMemberSchema.parse(body);

    await removeMember(auth.context.workspaceId, validated.memberId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot remove")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("[API] Remove member error:", error);
    Sentry.captureException(error, { tags: { api: "team-members-delete" } });
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

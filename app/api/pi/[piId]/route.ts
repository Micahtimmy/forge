import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProgramIncrementById, updatePICanvasData } from "@/lib/db/queries/pis";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import type { PICanvasData } from "@/types/pi";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ piId: string }> }
) {
  try {
    const { piId } = await params;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const pi = await getProgramIncrementById(workspace.workspaceId, piId);

    if (!pi) {
      return NextResponse.json(
        { error: "Program Increment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(pi);
  } catch (error) {
    console.error("PI API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch program increment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ piId: string }> }
) {
  try {
    const { piId } = await params;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Update canvas data
    if (body.canvasData) {
      await updatePICanvasData(
        workspace.workspaceId,
        piId,
        body.canvasData as PICanvasData
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PI update error:", error);
    return NextResponse.json(
      { error: "Failed to update program increment" },
      { status: 500 }
    );
  }
}

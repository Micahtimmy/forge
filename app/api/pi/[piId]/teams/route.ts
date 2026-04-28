import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPITeams, createPITeam, getProgramIncrementById } from "@/lib/db/queries/pis";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  totalCapacity: z.number().min(0).optional(),
});

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

    const teams = await getPITeams(piId);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("PI Teams API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const team = await createPITeam(piId, parsed.data.name, parsed.data.totalCapacity);

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("PI Team create error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

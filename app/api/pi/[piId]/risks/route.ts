import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPIRisks, createPIRisk, getProgramIncrementById } from "@/lib/db/queries/pis";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { z } from "zod";

const createRiskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  probability: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  mitigation: z.string().optional(),
  ownerId: z.string().uuid().optional(),
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

    const risks = await getPIRisks(piId);

    return NextResponse.json({ risks });
  } catch (error) {
    console.error("PI Risks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risks" },
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
    const parsed = createRiskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const risk = await createPIRisk(piId, parsed.data);

    return NextResponse.json({ risk }, { status: 201 });
  } catch (error) {
    console.error("PI Risk create error:", error);
    return NextResponse.json(
      { error: "Failed to create risk" },
      { status: 500 }
    );
  }
}

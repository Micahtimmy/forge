import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPIDependencies, createPIDependency, getProgramIncrementById } from "@/lib/db/queries/pis";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { z } from "zod";

const createDependencySchema = z.object({
  sourceFeatureId: z.string().uuid(),
  targetFeatureId: z.string().uuid(),
  description: z.string().optional(),
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

    const dependencies = await getPIDependencies(piId);

    return NextResponse.json({ dependencies });
  } catch (error) {
    console.error("PI Dependencies API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
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
    const parsed = createDependencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dependency = await createPIDependency(
      piId,
      parsed.data.sourceFeatureId,
      parsed.data.targetFeatureId,
      parsed.data.description
    );

    return NextResponse.json({ dependency }, { status: 201 });
  } catch (error) {
    console.error("PI Dependency create error:", error);
    return NextResponse.json(
      { error: "Failed to create dependency" },
      { status: 500 }
    );
  }
}

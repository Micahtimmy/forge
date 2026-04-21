import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDecisions, createDecision } from "@/lib/db/queries/signals";

const createDecisionSchema = z.object({
  title: z.string().min(1).max(500),
  reasoning: z.string().max(2000).optional(),
  affectedTickets: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  signalUpdateId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No workspace" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || undefined;

    const decisions = await getDecisions(membership.workspace_id, {
      limit,
      offset,
      search,
    });

    return NextResponse.json({ decisions });
  } catch (error) {
    console.error("Get decisions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No workspace" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createDecisionSchema.parse(body);

    const decision = await createDecision(
      membership.workspace_id,
      user.id,
      validated
    );

    return NextResponse.json({ decision });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create decision API error:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}

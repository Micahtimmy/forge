import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getPITeams, createPITeam, getProgramIncrementById } from "@/lib/db/queries/pis";
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

    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    const pi = await getProgramIncrementById(workspaceId, piId);
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
    Sentry.captureException(error, { tags: { api: "pi-teams-list" } });
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

    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    const pi = await getProgramIncrementById(workspaceId, piId);
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
    Sentry.captureException(error, { tags: { api: "pi-teams-create" } });
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

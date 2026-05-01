import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getPIDependencies, createPIDependency, getProgramIncrementById } from "@/lib/db/queries/pis";
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

    const dependencies = await getPIDependencies(piId);

    return NextResponse.json({ dependencies });
  } catch (error) {
    console.error("PI Dependencies API error:", error);
    Sentry.captureException(error, { tags: { api: "pi-dependencies-list" } });
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
    Sentry.captureException(error, { tags: { api: "pi-dependencies-create" } });
    return NextResponse.json(
      { error: "Failed to create dependency" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getPIFeatures, createPIFeature, getProgramIncrementById } from "@/lib/db/queries/pis";
import { z } from "zod";

const createFeatureSchema = z.object({
  teamId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  points: z.number().min(0).optional(),
  iterationIndex: z.number().min(0).optional(),
  jiraKey: z.string().optional(),
  riskLevel: z.enum(["none", "low", "medium", "high"]).optional(),
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

    const features = await getPIFeatures(piId);

    return NextResponse.json({ features });
  } catch (error) {
    console.error("PI Features API error:", error);
    Sentry.captureException(error, { tags: { api: "pi-features-list" } });
    return NextResponse.json(
      { error: "Failed to fetch features" },
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
    const parsed = createFeatureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const feature = await createPIFeature(piId, parsed.data);

    return NextResponse.json({ feature }, { status: 201 });
  } catch (error) {
    console.error("PI Feature create error:", error);
    Sentry.captureException(error, { tags: { api: "pi-features-create" } });
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}

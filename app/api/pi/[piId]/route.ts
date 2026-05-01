import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getProgramIncrementById, updatePICanvasData } from "@/lib/db/queries/pis";
import { z } from "zod";

// Canvas data validation schema
const canvasNodeDataSchema = z.union([
  // Feature card data
  z.object({
    title: z.string().max(500),
    points: z.number().min(0).max(10000),
    teamId: z.string().max(100),
    iterationIndex: z.number().min(0).max(100),
    jiraKey: z.string().max(50).optional(),
    riskLevel: z.enum(["none", "low", "medium", "high"]).optional(),
  }),
  // Iteration header data
  z.object({
    iterationNumber: z.number().min(0).max(100),
    startDate: z.string().max(50),
    endDate: z.string().max(50),
  }),
  // Team row data
  z.object({
    teamId: z.string().max(100),
    teamName: z.string().max(200),
    totalCapacity: z.number().min(0).max(100000),
    committed: z.number().min(0).max(100000),
  }),
  // Backlog item data
  z.object({
    title: z.string().max(500),
    points: z.number().min(0).max(10000),
    jiraKey: z.string().max(50).optional(),
  }),
  // Allow generic data for flexibility
  z.record(z.string(), z.unknown()),
]);

const canvasNodeSchema = z.object({
  id: z.string().max(100),
  type: z.string().max(50), // Allow any type string for flexibility with React Flow
  position: z.object({
    x: z.number().min(-100000).max(100000),
    y: z.number().min(-100000).max(100000),
  }),
  data: canvasNodeDataSchema,
});

const canvasEdgeSchema = z.object({
  id: z.string().max(100),
  source: z.string().max(100),
  target: z.string().max(100),
  type: z.string().max(50).optional(),
  data: z.object({
    status: z.enum(["open", "resolved", "at_risk", "blocked"]).optional(),
  }).optional(),
});

const canvasDataSchema = z.object({
  nodes: z.array(canvasNodeSchema).max(1000),
  edges: z.array(canvasEdgeSchema).max(2000),
  viewport: z.object({
    x: z.number().min(-100000).max(100000),
    y: z.number().min(-100000).max(100000),
    zoom: z.number().min(0.1).max(10),
  }).optional(),
});

const updatePISchema = z.object({
  canvasData: canvasDataSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["planning", "active", "completed"]).optional(),
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

    return NextResponse.json(pi);
  } catch (error) {
    console.error("PI API error:", error);
    Sentry.captureException(error, { tags: { api: "pi-get" } });
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

    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    // Verify PI exists and belongs to workspace
    const existingPI = await getProgramIncrementById(workspaceId, piId);
    if (!existingPI) {
      return NextResponse.json(
        { error: "Program Increment not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validate request body
    const parseResult = updatePISchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Update canvas data if provided
    if (validated.canvasData) {
      // Cast to PICanvasData after validation
      await updatePICanvasData(
        workspaceId,
        piId,
        validated.canvasData as unknown as import("@/types/pi").PICanvasData
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PI update error:", error);
    Sentry.captureException(error, { tags: { api: "pi-update" } });
    return NextResponse.json(
      { error: "Failed to update program increment" },
      { status: 500 }
    );
  }
}

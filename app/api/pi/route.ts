import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getProgramIncrements,
  createProgramIncrement,
  getPITeams,
  getPIDependencies,
  getPIRisks,
} from "@/lib/db/queries/pis";

const createPISchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid end date",
  }),
  iterationCount: z.number().min(1).max(20).optional(),
  iterationLengthWeeks: z.number().min(1).max(8).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;

    // Rate limiting
    const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
      | "planning"
      | "active"
      | "completed"
      | null;

    const pis = await getProgramIncrements(workspaceId, {
      status: status || undefined,
    });

    const pisWithCounts = await Promise.all(
      pis.map(async (pi) => {
        const [teams, dependencies, risks] = await Promise.all([
          getPITeams(pi.id),
          getPIDependencies(pi.id),
          getPIRisks(pi.id),
        ]);

        return {
          id: pi.id,
          name: pi.name,
          description: pi.description,
          startDate: pi.startDate.toISOString().split("T")[0],
          endDate: pi.endDate.toISOString().split("T")[0],
          status: pi.status,
          iterationCount: pi.iterationCount,
          iterationLengthWeeks: pi.iterationLengthWeeks,
          teamsCount: teams.length,
          dependenciesCount: dependencies.length,
          risksCount: risks.filter((r) => r.status !== "resolved").length,
          createdAt: pi.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ pis: pisWithCounts });
  } catch (error) {
    console.error("PIs API error:", error);
    return NextResponse.json({ error: "Failed to fetch PIs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;

    // Rate limiting
    const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const body = await req.json();
    const validated = createPISchema.parse(body);

    const pi = await createProgramIncrement(workspaceId, {
      name: validated.name,
      description: validated.description,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      iterationCount: validated.iterationCount,
      iterationLengthWeeks: validated.iterationLengthWeeks,
    });

    return NextResponse.json({
      success: true,
      pi: {
        id: pi.id,
        name: pi.name,
        description: pi.description,
        startDate: pi.startDate.toISOString().split("T")[0],
        endDate: pi.endDate.toISOString().split("T")[0],
        status: pi.status,
        iterationCount: pi.iterationCount,
        iterationLengthWeeks: pi.iterationLengthWeeks,
        createdAt: pi.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create PI API error:", error);
    return NextResponse.json({ error: "Failed to create PI" }, { status: 500 });
  }
}

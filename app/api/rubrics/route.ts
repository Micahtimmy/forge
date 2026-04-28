import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { createUntypedServerClient } from "@/lib/db/client";

const createRubricSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  completenessWeight: z.number().min(0).max(100).default(25),
  clarityWeight: z.number().min(0).max(100).default(25),
  estimabilityWeight: z.number().min(0).max(100).default(20),
  traceabilityWeight: z.number().min(0).max(100).default(15),
  testabilityWeight: z.number().min(0).max(100).default(15),
  customRules: z.array(z.any()).optional().default([]),
  isDefault: z.boolean().optional().default(false),
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

    const supabase = createUntypedServerClient();

    const { data: rubrics, error } = await supabase
      .from("scoring_rubrics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch rubrics: ${error.message}`);
    }

    const formattedRubrics = (rubrics || []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isDefault: r.is_default,
      completenessWeight: r.completeness_weight,
      clarityWeight: r.clarity_weight,
      estimabilityWeight: r.estimability_weight,
      traceabilityWeight: r.traceability_weight,
      testabilityWeight: r.testability_weight,
      customRules: r.custom_rules || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ rubrics: formattedRubrics });
  } catch (error) {
    console.error("Rubrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rubrics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;
    const body = await req.json();
    const validated = createRubricSchema.parse(body);

    const totalWeight =
      validated.completenessWeight +
      validated.clarityWeight +
      validated.estimabilityWeight +
      validated.traceabilityWeight +
      validated.testabilityWeight;

    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: "Weights must sum to 100" },
        { status: 400 }
      );
    }

    const supabase = createUntypedServerClient();

    if (validated.isDefault) {
      await supabase
        .from("scoring_rubrics")
        .update({ is_default: false })
        .eq("workspace_id", workspaceId);
    }

    const { data: rubric, error } = await supabase
      .from("scoring_rubrics")
      .insert({
        workspace_id: workspaceId,
        name: validated.name,
        description: validated.description,
        is_default: validated.isDefault,
        completeness_weight: validated.completenessWeight,
        clarity_weight: validated.clarityWeight,
        estimability_weight: validated.estimabilityWeight,
        traceability_weight: validated.traceabilityWeight,
        testability_weight: validated.testabilityWeight,
        custom_rules: validated.customRules,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rubric: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      rubric: {
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
        isDefault: rubric.is_default,
        completenessWeight: rubric.completeness_weight,
        clarityWeight: rubric.clarity_weight,
        estimabilityWeight: rubric.estimability_weight,
        traceabilityWeight: rubric.traceability_weight,
        testabilityWeight: rubric.testability_weight,
        customRules: rubric.custom_rules || [],
        createdAt: rubric.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create rubric API error:", error);
    return NextResponse.json(
      { error: "Failed to create rubric" },
      { status: 500 }
    );
  }
}

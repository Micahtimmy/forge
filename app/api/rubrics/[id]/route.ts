import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { createUntypedServerClient } from "@/lib/db/client";

const updateRubricSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completenessWeight: z.number().min(0).max(100).optional(),
  clarityWeight: z.number().min(0).max(100).optional(),
  estimabilityWeight: z.number().min(0).max(100).optional(),
  traceabilityWeight: z.number().min(0).max(100).optional(),
  testabilityWeight: z.number().min(0).max(100).optional(),
  customRules: z.array(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;
    const supabase = createUntypedServerClient();

    const { data: rubric, error } = await supabase
      .from("scoring_rubrics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Rubric not found" },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch rubric: ${error.message}`);
    }

    return NextResponse.json({
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
      updatedAt: rubric.updated_at,
    });
  } catch (error) {
    console.error("Rubric API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rubric" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;
    const body = await req.json();
    const validated = updateRubricSchema.parse(body);

    const supabase = createUntypedServerClient();

    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.completenessWeight !== undefined)
      updateData.completeness_weight = validated.completenessWeight;
    if (validated.clarityWeight !== undefined)
      updateData.clarity_weight = validated.clarityWeight;
    if (validated.estimabilityWeight !== undefined)
      updateData.estimability_weight = validated.estimabilityWeight;
    if (validated.traceabilityWeight !== undefined)
      updateData.traceability_weight = validated.traceabilityWeight;
    if (validated.testabilityWeight !== undefined)
      updateData.testability_weight = validated.testabilityWeight;
    if (validated.customRules !== undefined)
      updateData.custom_rules = validated.customRules;

    if (validated.isDefault === true) {
      await supabase
        .from("scoring_rubrics")
        .update({ is_default: false })
        .eq("workspace_id", workspaceId);
      updateData.is_default = true;
    } else if (validated.isDefault === false) {
      updateData.is_default = false;
    }

    const { data: rubric, error } = await supabase
      .from("scoring_rubrics")
      .update(updateData)
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update rubric: ${error.message}`);
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
        updatedAt: rubric.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update rubric API error:", error);
    return NextResponse.json(
      { error: "Failed to update rubric" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { workspaceId } = auth.context;
    const supabase = createUntypedServerClient();

    const { error } = await supabase
      .from("scoring_rubrics")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete rubric: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rubric API error:", error);
    return NextResponse.json(
      { error: "Failed to delete rubric" },
      { status: 500 }
    );
  }
}

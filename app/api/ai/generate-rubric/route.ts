import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getModel, GENERATION_CONFIGS, generateContentWithTimeout } from "@/lib/ai/client";

const generateRubricSchema = z.object({
  prompt: z.string().min(10).max(2000),
});

const RUBRIC_GENERATION_PROMPT = `You are an expert agile coach and quality assurance specialist. Generate a quality rubric for story scoring based on the team context provided.

Return a JSON object with this exact structure:
{
  "name": "Short descriptive name for the rubric (max 50 chars)",
  "description": "One sentence describing the rubric's focus",
  "dimensions": [
    {
      "id": "unique-id",
      "name": "Dimension Name",
      "description": "What this dimension measures and why it matters",
      "maxScore": 20
    }
  ]
}

Guidelines:
- Create exactly 5 dimensions
- Dimension scores must sum to exactly 100
- Make dimensions specific to the team context provided
- Use clear, actionable language
- Focus on measurable quality attributes
- Consider the team's domain, priorities, and challenges

Return ONLY the JSON object, no additional text.`;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const body = await req.json();
    const validated = generateRubricSchema.parse(body);

    const model = getModel();

    const result = await generateContentWithTimeout(model, {
      contents: [
        {
          role: "user",
          parts: [
            { text: RUBRIC_GENERATION_PROMPT },
            { text: `\n\nTeam Context:\n${validated.prompt}` },
          ],
        },
      ],
      generationConfig: {
        ...GENERATION_CONFIGS.analysis,
        temperature: 0.5,
      },
    });

    const responseText = result.response.text();

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      const rubricData = JSON.parse(jsonText);

      // Validate the response structure
      if (!rubricData.name || !rubricData.dimensions || !Array.isArray(rubricData.dimensions)) {
        throw new Error("Invalid rubric structure");
      }

      // Ensure dimensions sum to 100
      const totalScore = rubricData.dimensions.reduce(
        (sum: number, d: { maxScore: number }) => sum + (d.maxScore || 0),
        0
      );

      if (totalScore !== 100) {
        // Normalize scores to sum to 100
        const factor = 100 / totalScore;
        rubricData.dimensions = rubricData.dimensions.map((d: { id: string; name: string; description: string; maxScore: number }) => ({
          ...d,
          maxScore: Math.round(d.maxScore * factor),
        }));

        // Adjust for rounding errors
        const newTotal = rubricData.dimensions.reduce(
          (sum: number, d: { maxScore: number }) => sum + d.maxScore,
          0
        );
        if (newTotal !== 100 && rubricData.dimensions.length > 0) {
          rubricData.dimensions[0].maxScore += 100 - newTotal;
        }
      }

      return NextResponse.json(rubricData);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Generate rubric API error:", error);
    Sentry.captureException(error, {
      tags: { api: "generate-rubric" },
    });
    return NextResponse.json(
      { error: "Failed to generate rubric" },
      { status: 500 }
    );
  }
}

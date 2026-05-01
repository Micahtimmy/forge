/**
 * AI Chat API - Intelligent assistant powered by Gemini
 * Answers questions about sprints, teams, stories, and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/api/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Zod schema for request validation
const ChatContextStorySchema = z.object({
  id: z.string().optional(),
  jiraKey: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  storyPoints: z.number().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  score: z.object({
    totalScore: z.number().optional(),
  }).nullable().optional(),
});

const ChatContextMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
});

const ChatContextPISchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const ChatContextUpdateSchema = z.object({
  title: z.string().optional(),
  status: z.string().optional(),
  sentAt: z.string().nullable().optional(),
});

const ChatContextSchema = z.object({
  stories: z.array(ChatContextStorySchema),
  sprints: z.array(z.record(z.string(), z.unknown())),
  team: z.array(ChatContextMemberSchema),
  pis: z.array(ChatContextPISchema),
  updates: z.array(ChatContextUpdateSchema),
}).partial();

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  context: ChatContextSchema.optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;
type ContextStory = z.infer<typeof ChatContextStorySchema>;
type ContextMember = z.infer<typeof ChatContextMemberSchema>;
type ContextPI = z.infer<typeof ChatContextPISchema>;
type ContextUpdate = z.infer<typeof ChatContextUpdateSchema>;

const SYSTEM_PROMPT = `You are FORGE AI, an intelligent assistant for agile teams using the FORGE platform. You help Scrum Masters, Product Managers, Engineering Managers, RTEs, and developers understand their sprint data, team performance, and project health.

You have access to real-time data about:
- Stories (with quality scores, status, assignees, story points)
- Sprints (progress, velocity, burndown)
- Team members (capacity, assignments, performance)
- Program Increments (PI objectives, risks, dependencies)
- Signal updates (stakeholder communications)

When answering questions:
1. Be specific and data-driven - cite actual numbers from the data
2. Identify patterns and trends
3. Provide actionable recommendations
4. Format responses with markdown for readability
5. If asked about individual contributions, calculate their completed stories, points, and quality scores
6. If data is missing, acknowledge it and suggest what data would help

Keep responses concise but comprehensive. Use tables for comparisons, bullet points for lists, and bold for key metrics.`;

function buildContextPrompt(context: ChatRequest["context"] | undefined): string {
  const stories = context?.stories || [];
  const team = context?.team || [];
  const pis = context?.pis || [];
  const updates = context?.updates || [];

  // Calculate story statistics
  const storyStats = {
    total: stories.length,
    done: stories.filter((s: ContextStory) => s.status === "done").length,
    inProgress: stories.filter((s: ContextStory) => s.status === "in_progress").length,
    todo: stories.filter((s: ContextStory) => s.status === "todo" || s.status === "ready").length,
    avgScore: stories.length > 0
      ? Math.round(stories.reduce((sum: number, s: ContextStory) => sum + (s.score?.totalScore || 0), 0) / stories.length)
      : 0,
    atRisk: stories.filter((s: ContextStory) => (s.score?.totalScore || 0) < 60).length,
  };

  // Calculate team contributions
  const teamContributions = team.map((member: ContextMember) => {
    const memberStories = stories.filter((s: ContextStory) => s.assigneeId === member.id);
    const completedStories = memberStories.filter((s: ContextStory) => s.status === "done");
    const completedPoints = completedStories.reduce((sum: number, s: ContextStory) => sum + (s.storyPoints || 0), 0);
    const avgQuality = memberStories.length > 0
      ? Math.round(memberStories.reduce((sum: number, s: ContextStory) => sum + (s.score?.totalScore || 0), 0) / memberStories.length)
      : 0;

    return {
      name: member.name,
      role: member.role,
      totalStories: memberStories.length,
      completedStories: completedStories.length,
      inProgressStories: memberStories.filter((s: ContextStory) => s.status === "in_progress").length,
      completedPoints,
      avgQualityScore: avgQuality,
    };
  });

  // Build context string
  return `
## Current Data Context

### Sprint Overview
- Total Stories: ${storyStats.total}
- Completed: ${storyStats.done} (${Math.round((storyStats.done / storyStats.total) * 100)}%)
- In Progress: ${storyStats.inProgress}
- To Do: ${storyStats.todo}
- Average Quality Score: ${storyStats.avgScore}
- Stories at Risk (score < 60): ${storyStats.atRisk}

### Stories Detail
${stories.slice(0, 20).map((s: ContextStory) => `- ${s.jiraKey}: "${s.title}" | Status: ${s.status} | Score: ${s.score?.totalScore || 'N/A'} | Points: ${s.storyPoints || 'N/A'} | Assignee: ${team.find((t: ContextMember) => t.id === s.assigneeId)?.name || 'Unassigned'}`).join('\n')}

### Team Members & Contributions
${teamContributions.map((m: { name?: string; role?: string; completedStories: number; inProgressStories: number; completedPoints: number; avgQualityScore: number }) => `- **${m.name}** (${m.role}): ${m.completedStories} completed, ${m.inProgressStories} in progress, ${m.completedPoints} points delivered, Avg Quality: ${m.avgQualityScore}`).join('\n')}

### Active Program Increments
${pis.filter((p: ContextPI) => p.status === "active").map((p: ContextPI) => `- ${p.name}: ${p.startDate} to ${p.endDate}`).join('\n') || 'No active PIs'}

### Recent Updates
${updates.slice(0, 5).map((u: ContextUpdate) => `- ${u.title} (${u.status}): ${u.sentAt ? 'Sent' : 'Draft'}`).join('\n') || 'No recent updates'}
`;
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    // Rate limiting
    const rateLimitResult = checkRateLimit(req, auth.context.user.id, {
      limit: 30,
      windowSeconds: 60, // 30 requests per minute
      identifier: "ai-chat",
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = ChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { message, context } = parseResult.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextPrompt = buildContextPrompt(context);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextPrompt}\n\n## User Question\n${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI Chat error:", error);
    Sentry.captureException(error, {
      tags: { api: "ai-chat" },
    });
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

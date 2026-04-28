/**
 * AI Chat API - Intelligent assistant powered by Gemini
 * Answers questions about sprints, teams, stories, and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ChatRequest {
  message: string;
  context: {
    stories: any[];
    sprints: any[];
    team: any[];
    pis: any[];
    updates: any[];
  };
}

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

function buildContextPrompt(context: ChatRequest["context"]): string {
  const { stories, sprints, team, pis, updates } = context;

  // Calculate story statistics
  const storyStats = {
    total: stories.length,
    done: stories.filter(s => s.status === "done").length,
    inProgress: stories.filter(s => s.status === "in_progress").length,
    todo: stories.filter(s => s.status === "todo" || s.status === "ready").length,
    avgScore: stories.length > 0
      ? Math.round(stories.reduce((sum, s) => sum + (s.score?.totalScore || 0), 0) / stories.length)
      : 0,
    atRisk: stories.filter(s => (s.score?.totalScore || 0) < 60).length,
  };

  // Calculate team contributions
  const teamContributions = team.map(member => {
    const memberStories = stories.filter(s => s.assigneeId === member.id);
    const completedStories = memberStories.filter(s => s.status === "done");
    const completedPoints = completedStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
    const avgQuality = memberStories.length > 0
      ? Math.round(memberStories.reduce((sum, s) => sum + (s.score?.totalScore || 0), 0) / memberStories.length)
      : 0;

    return {
      name: member.name,
      role: member.role,
      totalStories: memberStories.length,
      completedStories: completedStories.length,
      inProgressStories: memberStories.filter(s => s.status === "in_progress").length,
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
${stories.slice(0, 20).map(s => `- ${s.jiraKey}: "${s.title}" | Status: ${s.status} | Score: ${s.score?.totalScore || 'N/A'} | Points: ${s.storyPoints || 'N/A'} | Assignee: ${team.find(t => t.id === s.assigneeId)?.name || 'Unassigned'}`).join('\n')}

### Team Members & Contributions
${teamContributions.map(m => `- **${m.name}** (${m.role}): ${m.completedStories} completed, ${m.inProgressStories} in progress, ${m.completedPoints} points delivered, Avg Quality: ${m.avgQualityScore}`).join('\n')}

### Active Program Increments
${pis.filter(p => p.status === "active").map(p => `- ${p.name}: ${p.startDate} to ${p.endDate}`).join('\n') || 'No active PIs'}

### Recent Updates
${updates.slice(0, 5).map(u => `- ${u.title} (${u.status}): ${u.sentAt ? 'Sent' : 'Draft'}`).join('\n') || 'No recent updates'}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

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
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

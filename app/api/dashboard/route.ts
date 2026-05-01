import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getDashboardData } from "@/lib/db/queries/dashboard";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    // Fetch dashboard data
    const data = await getDashboardData(workspaceId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    Sentry.captureException(error, { tags: { api: "dashboard" } });
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

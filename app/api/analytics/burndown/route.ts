import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getBurndownData } from "@/lib/db/queries/analytics";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { user, workspaceId } = auth.context;

    const rateLimit = checkRateLimit(req, user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const data = await getBurndownData(workspaceId);
    return NextResponse.json(data);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to fetch burndown data" }, { status: 500 });
  }
}

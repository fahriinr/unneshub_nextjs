import { NextRequest, NextResponse } from "next/server";
import { getGlobalFeed, getPersonalizedFeed } from "@/lib/services/feed-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitVal = searchParams.get("limit");
    const pageVal = searchParams.get("page");
    const personalized = searchParams.get("personalized") === "true";

    const limit = limitVal ? parseInt(limitVal, 10) : undefined;
    const page = pageVal ? parseInt(pageVal, 10) : undefined;

    if (limit && (isNaN(limit) || limit <= 0)) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    if (page && (isNaN(page) || page <= 0)) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const feed = personalized
      ? await getPersonalizedFeed({ limit, page })
      : await getGlobalFeed({ limit, page });

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch feed";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

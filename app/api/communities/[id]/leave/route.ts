import { NextRequest, NextResponse } from "next/server";
import { leaveCommunity } from "@/lib/services/community-management-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await leaveCommunity(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to leave community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

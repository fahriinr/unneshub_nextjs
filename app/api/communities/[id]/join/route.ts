import { NextRequest, NextResponse } from "next/server";
import { joinCommunity } from "@/lib/services/community-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const membership = await joinCommunity(id);
    return NextResponse.json(membership, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to join community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isNotFound = errorMessage.includes("not found");
    const isConflict = errorMessage.includes("already a member");
    const status = isUnauthorized ? 401 : isNotFound ? 404 : isConflict ? 409 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

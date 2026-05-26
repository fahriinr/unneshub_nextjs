import { NextRequest, NextResponse } from "next/server";
import { toggleLike, getPostLikeCount } from "@/lib/services/like-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Toggle the like status
    const { liked } = await toggleLike(id);

    // Fetch the updated total like count
    const { count } = await getPostLikeCount(id);

    return NextResponse.json({ liked, likeCount: count }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to toggle like";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

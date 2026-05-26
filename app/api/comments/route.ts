import { NextRequest, NextResponse } from "next/server";
import { getCommentsByPost, createComment } from "@/lib/services/comment-service";
import { createCommentSchema } from "@/lib/validations/comment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const limitVal = searchParams.get("limit");
    const pageVal = searchParams.get("page");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const limit = limitVal ? parseInt(limitVal, 10) : undefined;
    const page = pageVal ? parseInt(pageVal, 10) : undefined;

    if (limit && (isNaN(limit) || limit <= 0)) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    if (page && (isNaN(page) || page <= 0)) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const comments = await getCommentsByPost(postId, { limit, page });
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch comments";
    const isNotFound = errorMessage.includes("NotFound");
    const status = isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const comment = await createComment(result.data);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create comment";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

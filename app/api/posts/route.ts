import { NextRequest, NextResponse } from "next/server";
import { getPosts, createPost } from "@/lib/services/post-service";
import { createPostSchema } from "@/lib/validations/post";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId") || undefined;
    const limitVal = searchParams.get("limit");
    const pageVal = searchParams.get("page");

    const limit = limitVal ? parseInt(limitVal, 10) : undefined;
    const page = pageVal ? parseInt(pageVal, 10) : undefined;

    if (limit && (isNaN(limit) || limit <= 0)) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    if (page && (isNaN(page) || page <= 0)) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const posts = await getPosts({
      communityId,
      limit,
      page,
    });

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch posts";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const post = await createPost(result.data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create post";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

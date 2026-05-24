import { NextRequest, NextResponse } from "next/server";
import { getCommunities, createCommunity } from "@/lib/services/community-service";
import { createCommunitySchema } from "@/lib/validations/community";
import { CommunityCategory } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as CommunityCategory | null;
    const search = searchParams.get("search") || undefined;
    const limitVal = searchParams.get("limit");
    const pageVal = searchParams.get("page");

    const limit = limitVal ? parseInt(limitVal, 10) : undefined;
    const page = pageVal ? parseInt(pageVal, 10) : undefined;

    if (category && !Object.values(CommunityCategory).includes(category)) {
      return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
    }

    if (limit && (isNaN(limit) || limit <= 0)) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    if (page && (isNaN(page) || page <= 0)) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const communities = await getCommunities({
      category: category || undefined,
      search,
      limit,
      page,
    });
    return NextResponse.json(communities, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch communities";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createCommunitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const community = await createCommunity(result.data);
    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isConflict = errorMessage.includes("already exists");
    const status = isUnauthorized ? 401 : isConflict ? 409 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

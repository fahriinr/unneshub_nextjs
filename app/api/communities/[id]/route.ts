import { NextRequest, NextResponse } from "next/server";
import { getCommunityById } from "@/lib/services/community-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const community = await getCommunityById(id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    return NextResponse.json(community, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch community";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

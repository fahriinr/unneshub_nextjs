import { NextRequest, NextResponse } from "next/server";
import { getCommunityMembers } from "@/lib/services/community-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await getCommunityMembers(id);
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch community members";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

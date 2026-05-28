import { NextRequest, NextResponse } from "next/server";
import { kickMember } from "@/lib/services/community-management-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const result = await kickMember(id, memberId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to kick member";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

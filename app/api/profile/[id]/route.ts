import { NextRequest, NextResponse } from "next/server";
import { getUserProfileById } from "@/lib/services/profile-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getUserProfileById(id);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user profile";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

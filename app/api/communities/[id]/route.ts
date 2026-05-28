import { NextRequest, NextResponse } from "next/server";
import { getCommunityById } from "@/lib/services/community-service";
import { updateCommunity, deleteCommunity } from "@/lib/services/community-management-service";
import { updateCommunitySchema } from "@/lib/validations/community-management";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateCommunitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateCommunity(id, result.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const isConflict = errorMessage.includes("Conflict");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : isConflict ? 409 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCommunity(id);
    return NextResponse.json(deleted, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

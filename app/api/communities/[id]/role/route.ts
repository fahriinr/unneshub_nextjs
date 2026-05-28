import { NextRequest, NextResponse } from "next/server";
import { updateMemberRole } from "@/lib/services/community-management-service";
import { updateMemberRoleSchema } from "@/lib/validations/community-management";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateMemberRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateMemberRole(id, result.data.memberId, result.data.role);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update member role";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const isBadRequest = errorMessage.includes("BadRequest");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : isBadRequest ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

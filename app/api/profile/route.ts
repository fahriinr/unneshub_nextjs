import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile, updateProfile } from "@/lib/services/profile-service";
import { updateProfileSchema } from "@/lib/validations/profile";
import { requireAuth } from "@/lib/auth/community-permissions";

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentUserProfile();
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const profile = await updateProfile(user.id, result.data);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    const isNotFound = errorMessage.includes("NotFound");
    const isBadRequest = errorMessage.includes("BadRequest");
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isNotFound ? 404 : isBadRequest ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireGlobalAdmin } from "@/lib/auth/community-permissions";
import { prisma } from "@/lib/prisma";
import { CommunityStatus } from "@/app/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireGlobalAdmin();
    const { id } = await params;
    const { status } = await request.json();

    if (!status || !["APPROVED", "PENDING_APPROVAL", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.community.update({
      where: { id },
      data: {
        status: status as CommunityStatus,
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to verify community";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    return NextResponse.json(
      { error: errorMessage },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

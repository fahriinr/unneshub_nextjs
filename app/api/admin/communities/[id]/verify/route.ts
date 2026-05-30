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
    const { status, rules } = await request.json();

    const updateData: any = {};
    if (status) {
      if (!["APPROVED", "PENDING_APPROVAL", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status as CommunityStatus;
    }
    if (rules !== undefined) {
      updateData.rules = rules;
    }

    const updated = await prisma.community.update({
      where: { id },
      data: updateData,
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

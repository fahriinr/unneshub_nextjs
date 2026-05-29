import { NextRequest, NextResponse } from "next/server";
import { requireGlobalAdmin } from "@/lib/auth/community-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireGlobalAdmin();
    const communities = await prisma.community.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(communities, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch admin communities";
    const isUnauthorized = errorMessage.includes("Unauthorized");
    const isForbidden = errorMessage.includes("Forbidden");
    return NextResponse.json(
      { error: errorMessage },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

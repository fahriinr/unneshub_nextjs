import { prisma } from "../prisma";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) {
    throw new Error("Unauthorized: You must be logged in to access this resource");
  }
  return session.user;
}

export async function requireGlobalAdmin() {
  const user = await requireAuth();
  if (user.role !== "GLOBAL_ADMIN") {
    throw new Error("Forbidden: Global Admin privileges required");
  }
  return user;
}

export async function requireCommunityMember(communityId: string) {
  const user = await requireAuth();

  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id,
      },
    },
  });

  if (!membership || membership.status !== "APPROVED") {
    throw new Error("Forbidden: You are not an approved member of this community");
  }

  return { user, membership };
}

export async function requireCommunityAdmin(communityId: string) {
  const { user, membership } = await requireCommunityMember(communityId);

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true },
  });

  if (!community) {
    throw new Error("NotFound: Community not found");
  }

  const isOwner = community.creatorId === user.id;

  if (membership.role !== "ADMIN" && !isOwner) {
    throw new Error("Forbidden: Admin privileges required for this community");
  }

  return { user, membership, isOwner };
}

export async function requireCommunityOwner(communityId: string) {
  const user = await requireAuth();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true },
  });

  if (!community) {
    throw new Error("NotFound: Community not found");
  }

  if (community.creatorId !== user.id) {
    throw new Error("Forbidden: You must be the owner of this community");
  }

  return { user, community };
}

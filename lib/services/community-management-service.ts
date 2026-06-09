import { prisma } from "../prisma";
import { requireAuth, requireCommunityAdmin, requireCommunityOwner } from "../auth/community-permissions";
import { CommunityRole, UserRole } from "../../app/generated/prisma/client";

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  rules?: string;
  coverImage?: string;
  tags?: string[];
}

export async function updateCommunity(communityId: string, data: UpdateCommunityInput) {
  await requireCommunityAdmin(communityId);

  if (data.name) {
    const existingName = await prisma.community.findFirst({
      where: {
        name: data.name,
        NOT: { id: communityId },
      },
    });
    if (existingName) {
      throw new Error("Conflict: Community name already exists");
    }
  }

  return await prisma.community.update({
    where: { id: communityId },
    data: {
      name: data.name,
      description: data.description,
      rules: data.rules,
      coverImage: data.coverImage,
      tags: data.tags,
    },
  });
}

export async function deleteCommunity(communityId: string) {
  await requireCommunityOwner(communityId);

  return await prisma.community.delete({
    where: { id: communityId },
  });
}

export async function leaveCommunity(communityId: string) {
  const user = await requireAuth();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true },
  });

  if (!community) {
    throw new Error("NotFound: Community not found");
  }

  if (community.creatorId === user.id) {
    throw new Error("Forbidden: Owner cannot leave the community. Transfer ownership or delete the community instead.");
  }

  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("NotFound: You are not a member of this community");
  }

  return await prisma.communityMember.delete({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id,
      },
    },
  });
}

export async function kickMember(communityId: string, memberId: string) {
  const user = await requireAuth();
  const isGlobalAdmin = (user as any).role === "GLOBAL_ADMIN";

  const [currentUserMember, targetMember, community] = await prisma.$transaction([
    prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: user.id,
        },
      },
    }),
    prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: memberId,
        },
      },
    }),
    prisma.community.findUnique({
      where: { id: communityId },
      select: { creatorId: true },
    }),
  ]);

  if (!community) {
    throw new Error("NotFound: Community not found");
  }

  // Global Admin can kick anyone except community owner
  if (!isGlobalAdmin) {
    if (!currentUserMember || currentUserMember.status !== "APPROVED" || (currentUserMember.role !== "ADMIN" && community.creatorId !== user.id)) {
      throw new Error("Forbidden: Admin privileges required to kick members");
    }
  }

  if (!targetMember) {
    throw new Error("NotFound: Target member not found in this community");
  }

  if (community.creatorId === memberId) {
    throw new Error("Forbidden: The community owner cannot be kicked");
  }

  if (user.id === memberId) {
    throw new Error("Forbidden: You cannot kick yourself");
  }

  // Prevent admins from kicking other admins (only owner or global admin can kick admins)
  const isOwner = community.creatorId === user.id;
  if (!isOwner && !isGlobalAdmin && targetMember.role === "ADMIN") {
    throw new Error("Forbidden: Only the community owner can kick an admin");
  }

  return await prisma.communityMember.delete({
    where: {
      communityId_userId: {
        communityId,
        userId: memberId,
      },
    },
  });
}

export async function updateMemberRole(communityId: string, memberId: string, newRole: CommunityRole) {
  const user = await requireAuth();
  const isGlobalAdmin = (user as any).role === "GLOBAL_ADMIN";

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true },
  });

  if (!community) {
    throw new Error("NotFound: Community not found");
  }

  // Only community owner or Global Admin can change roles
  if (community.creatorId !== user.id && !isGlobalAdmin) {
    throw new Error("Forbidden: You must be the owner of this community");
  }

  if (community.creatorId === memberId) {
    throw new Error("Forbidden: Cannot modify the role of the community owner");
  }

  const targetMember = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId: memberId,
      },
    },
  });

  if (!targetMember) {
    throw new Error("NotFound: Target member not found in this community");
  }

  if (targetMember.role === newRole) {
    throw new Error("BadRequest: Member already has this role");
  }

  return await prisma.communityMember.update({
    where: {
      communityId_userId: {
        communityId,
        userId: memberId,
      },
    },
    data: {
      role: newRole,
    },
  });
}

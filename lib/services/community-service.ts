import { prisma } from "../prisma";
import { auth } from "../auth/auth";
import { headers } from "next/headers";
import { CreateCommunityInput } from "../validations/community";
import { CommunityCategory, CommunityStatus, Prisma, UserRole } from "../../app/generated/prisma/client";
import { cache } from "react";

interface CurrentUserSession {
  id: string;
  role: UserRole;
}

// Request-level cache to eliminate Session Churn within a single request cycle
const getSessionCached = cache(async (headersInit: Headers) => {
  return await auth.api.getSession({
    headers: headersInit,
  });
});

async function getCurrentUserOrNull(): Promise<CurrentUserSession | null> {
  try {
    const session = await getSessionCached(await headers());
    if (!session || !session.user) return null;
    return {
      id: session.user.id,
      role: session.user.role as UserRole,
    };
  } catch {
    return null;
  }
}

async function getAuthenticatedUser() {
  const session = await getSessionCached(await headers());
  if (!session || !session.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  return session.user;
}

export interface CommunityPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  isCommunityAdmin: boolean;
  isCommunityOwner: boolean;
}

export type CommunityWithPermissions<T> = T & {
  permissions: CommunityPermissions;
};

async function enrichCommunity<T extends { id: string; creatorId: string }>(
  community: T,
  currentUser: CurrentUserSession | null
): Promise<CommunityWithPermissions<T> & { isJoined: boolean }> {
  if (!currentUser) {
    return {
      ...community,
      isJoined: false,
      permissions: {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        isCommunityAdmin: false,
        isCommunityOwner: false,
      },
    };
  }

  const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";
  const isOwner = community.creatorId === currentUser.id;

  let isAdmin = isOwner;
  let isJoined = isOwner;
  if (!isOwner) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: currentUser.id,
        },
      },
      select: { role: true, status: true },
    });
    if (membership && membership.status === "APPROVED") {
      isJoined = true;
      if (membership.role === "ADMIN") {
        isAdmin = true;
      }
    }
  }

  return {
    ...community,
    isJoined,
    permissions: {
      canEdit: isOwner || isAdmin || isGlobalAdmin,
      canDelete: isOwner || isGlobalAdmin,
      canManageMembers: isOwner || isAdmin || isGlobalAdmin,
      isCommunityAdmin: isAdmin,
      isCommunityOwner: isOwner,
    },
  };
}

async function enrichCommunities<T extends { id: string; creatorId: string }>(
  communities: T[],
  currentUser: CurrentUserSession | null
): Promise<(CommunityWithPermissions<T> & { isJoined: boolean })[]> {
  if (communities.length === 0) return [];
  if (!currentUser) {
    return communities.map(c => ({
      ...c,
      isJoined: false,
      permissions: {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        isCommunityAdmin: false,
        isCommunityOwner: false,
      },
    }));
  }

  const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";
  const communityIds = communities.map(c => c.id);

  const memberships = await prisma.communityMember.findMany({
    where: {
      communityId: { in: communityIds },
      userId: currentUser.id,
      status: "APPROVED",
    },
    select: { communityId: true, role: true },
  });

  const membershipMap = new Map(memberships.map(m => [m.communityId, m.role]));

  return communities.map(community => {
    const isOwner = community.creatorId === currentUser.id;
    const memberRole = membershipMap.get(community.id);
    const isAdmin = isOwner || memberRole === "ADMIN";
    const isJoined = isOwner || memberRole !== undefined;

    return {
      ...community,
      isJoined,
      permissions: {
        canEdit: isOwner || isAdmin || isGlobalAdmin,
        canDelete: isOwner || isGlobalAdmin,
        canManageMembers: isOwner || isAdmin || isGlobalAdmin,
        isCommunityAdmin: isAdmin,
        isCommunityOwner: isOwner,
      },
    };
  });
}

export async function createCommunity(data: CreateCommunityInput) {
  const user = await getAuthenticatedUser();

  // Validate slug uniqueness
  const existingSlug = await prisma.community.findUnique({
    where: { slug: data.slug },
  });
  if (existingSlug) {
    throw new Error("Community slug already exists");
  }

  // Validate name uniqueness
  const existingName = await prisma.community.findUnique({
    where: { name: data.name },
  });
  if (existingName) {
    throw new Error("Community name already exists");
  }

  // Transaction to create community and make creator an ADMIN member
  const community = await prisma.$transaction(async (tx) => {
    const newCommunity = await tx.community.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        rules: data.rules,
        tags: data.tags || [],
        category: data.category as CommunityCategory,
        creatorId: user.id,
        status: "PENDING_APPROVAL" as CommunityStatus,
      },
    });

    await tx.communityMember.create({
      data: {
        communityId: newCommunity.id,
        userId: user.id,
        role: "ADMIN",
        status: "APPROVED",
      },
    });

    return newCommunity;
  });

  const currentUser = await getCurrentUserOrNull();
  return await enrichCommunity(community, currentUser);
}

export async function getCommunityById(id: string) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });

  if (!community) return null;
  const currentUser = await getCurrentUserOrNull();
  return await enrichCommunity(community, currentUser);
}

export async function getCommunityBySlug(slug: string) {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });

  if (!community) return null;
  const currentUser = await getCurrentUserOrNull();
  return await enrichCommunity(community, currentUser);
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetCommunitiesOptions {
  category?: CommunityCategory;
  search?: string;
  limit?: number;
  page?: number;
}

export type CommunityWithCount = Prisma.CommunityGetPayload<{
  include: {
    _count: {
      select: {
        members: true;
      };
    };
  };
}>;

export async function getCommunities(
  options: GetCommunitiesOptions = {},
): Promise<
  PaginatedResult<
    CommunityWithPermissions<CommunityWithCount> & { isJoined: boolean }
  >
> {
  const { category, search, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const currentUser = await getCurrentUserOrNull();
  const isGlobalAdmin = currentUser?.role === "GLOBAL_ADMIN";

  const where: Prisma.CommunityWhereInput = {};

  if (category) {
    where.category = category;
  }

  // Enforce community status validation (only Global Admins see unapproved communities)
  if (!isGlobalAdmin) {
    if (currentUser) {
      where.AND = [
        {
          OR: [
            { status: "APPROVED" },
            { creatorId: currentUser.id }
          ]
        }
      ];
    } else {
      where.status = "APPROVED";
    }
  }

  if (search) {
    const searchCondition = {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ],
    };

    if (where.AND) {
      (where.AND as Prisma.CommunityWhereInput[]).push(searchCondition);
    } else {
      where.AND = [searchCondition];
    }
  }

  // Run count + findMany in parallel to halve DB latency
  const [total, communities] = await Promise.all([
    prisma.community.count({ where }),
    prisma.community.findMany({
      where,
      take: limit,
      skip,
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const enriched = await enrichCommunities(communities, currentUser);
  const totalPages = Math.ceil(total / limit);

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function joinCommunity(communityId: string) {
  const user = await getAuthenticatedUser();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });
  if (!community) {
    throw new Error("Community not found");
  }

  // Prevent duplicate membership
  const existingMember = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id,
      },
    },
  });
  if (existingMember) {
    throw new Error("User is already a member of this community");
  }

  return await prisma.communityMember.create({
    data: {
      communityId,
      userId: user.id,
      role: "MEMBER",
      status: "APPROVED",
    },
  });
}

export async function leaveCommunity(communityId: string) {
  const user = await getAuthenticatedUser();

  const existingMember = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId: user.id,
      },
    },
  });
  if (!existingMember) {
    throw new Error("You are not a member of this community");
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

export async function getCommunityMembers(communityId: string) {
  return await prisma.communityMember.findMany({
    where: { communityId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });
}

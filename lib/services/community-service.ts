import { prisma } from "../prisma";
import { auth } from "../auth/auth";
import { headers } from "next/headers";
import { CreateCommunityInput } from "../validations/community";
import { CommunityCategory, CommunityStatus, Prisma } from "../../app/generated/prisma/client";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  return session.user;
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
  return await prisma.$transaction(async (tx) => {
    const community = await tx.community.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        rules: data.rules,
        category: data.category as CommunityCategory,
        creatorId: user.id,
        status: "APPROVED" as CommunityStatus,
      },
    });

    await tx.communityMember.create({
      data: {
        communityId: community.id,
        userId: user.id,
        role: "ADMIN",
        status: "APPROVED",
      },
    });

    return community;
  });
}

export async function getCommunityById(id: string) {
  return await prisma.community.findUnique({
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
}

export async function getCommunityBySlug(slug: string) {
  return await prisma.community.findUnique({
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
}

export interface GetCommunitiesOptions {
  category?: CommunityCategory;
  search?: string;
  limit?: number;
  page?: number;
}

export async function getCommunities(options: GetCommunitiesOptions = {}) {
  const { category, search, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.CommunityWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  return await prisma.community.findMany({
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
  });
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

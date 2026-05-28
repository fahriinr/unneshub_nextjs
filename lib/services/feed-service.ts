import { prisma } from "../prisma";
import { auth } from "../auth/auth";
import { headers } from "next/headers";
import { Prisma, UserRole } from "../../app/generated/prisma/client";

export type FeedPostWithRelations = Prisma.PostGetPayload<{
  include: {
    community: true;
    author: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        role: true;
      };
    };
    _count: {
      select: {
        likes: true;
        comments: true;
      };
    };
  };
}>;

export interface PostPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  isCommunityAdmin: boolean;
  isCommunityOwner: boolean;
}

export type FeedPost = FeedPostWithRelations & {
  likedByCurrentUser: boolean;
  permissions: PostPermissions;
};

interface CurrentUserSession {
  id: string;
  role: UserRole;
}

async function getCurrentUserOrNull(): Promise<CurrentUserSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) return null;
    return {
      id: session.user.id,
      role: session.user.role as UserRole,
    };
  } catch {
    return null;
  }
}

function maskAnonymousAuthor<T extends FeedPostWithRelations>(
  post: T,
  currentUser: CurrentUserSession | null
): T {
  if (post.isAnonymous) {
    const isGlobalAdmin = currentUser?.role === "GLOBAL_ADMIN";
    if (!isGlobalAdmin) {
      return {
        ...post,
        author: {
          id: "anonymous",
          name: "Anonymous",
          email: "",
          image: null,
          role: "MAHASISWA" as UserRole,
        },
      };
    }
  }
  return post;
}

async function enrichAndFormatPosts(
  posts: FeedPostWithRelations[],
  currentUser: CurrentUserSession | null
): Promise<FeedPost[]> {
  if (posts.length === 0) return [];

  const currentUserId = currentUser?.id || null;
  const isGlobalAdmin = currentUser?.role === "GLOBAL_ADMIN";

  // 1. Mask anonymous posts
  const maskedPosts = posts.map(p => maskAnonymousAuthor(p, currentUser));

  // 2. Fetch user likes
  const postIds = maskedPosts.map(p => p.id);
  const userLikes = currentUserId ? await prisma.like.findMany({
    where: {
      postId: { in: postIds },
      userId: currentUserId,
    },
    select: { postId: true },
  }) : [];
  const likedPostIds = new Set(userLikes.map(l => l.postId));

  // 3. Fetch community creators & memberships for permissions
  const communityIds = Array.from(new Set(maskedPosts.map(p => p.communityId)));
  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, creatorId: true },
  });
  const communityCreatorMap = new Map(communities.map(c => [c.id, c.creatorId]));

  const memberships = currentUserId ? await prisma.communityMember.findMany({
    where: {
      communityId: { in: communityIds },
      userId: currentUserId,
      status: "APPROVED",
    },
    select: { communityId: true, role: true },
  }) : [];
  const membershipMap = new Map(memberships.map(m => [m.communityId, m.role]));

  // 4. Combine into final FeedPost structure
  return maskedPosts.map(post => {
    const isAuthor = post.userId === currentUserId;
    const creatorId = communityCreatorMap.get(post.communityId);
    const isOwner = creatorId === currentUserId;
    const memberRole = membershipMap.get(post.communityId);
    const isAdmin = isOwner || memberRole === "ADMIN";

    return {
      ...post,
      likedByCurrentUser: likedPostIds.has(post.id),
      permissions: {
        canEdit: isAuthor,
        canDelete: isAuthor || isAdmin || isGlobalAdmin,
        canManageMembers: false,
        isCommunityAdmin: isAdmin,
        isCommunityOwner: isOwner,
      },
    };
  });
}

export interface FeedOptions {
  limit?: number;
  page?: number;
}

export async function getGlobalFeed(options: FeedOptions = {}): Promise<FeedPost[]> {
  const { limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    take: limit,
    skip,
    include: {
      community: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const currentUser = await getCurrentUserOrNull();
  return await enrichAndFormatPosts(posts, currentUser);
}

export async function getPersonalizedFeed(options: FeedOptions = {}): Promise<FeedPost[]> {
  const { limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const currentUser = await getCurrentUserOrNull();
  if (!currentUser) {
    throw new Error("Unauthorized: You must be logged in to get a personalized feed");
  }

  // Fetch user's joined communities
  const memberships = await prisma.communityMember.findMany({
    where: {
      userId: currentUser.id,
      status: "APPROVED",
    },
    select: { communityId: true },
  });
  const joinedCommunityIds = memberships.map(m => m.communityId);

  // Filter: posts from joined communities OR user's own posts
  const where: Prisma.PostWhereInput = {
    OR: [
      { communityId: { in: joinedCommunityIds } },
      { userId: currentUser.id }
    ]
  };

  let posts = await prisma.post.findMany({
    where,
    take: limit,
    skip,
    include: {
      community: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fallback: If personalized feed is empty, fall back to global feed (on first page)
  if (posts.length === 0 && page === 1) {
    posts = await prisma.post.findMany({
      take: limit,
      skip,
      include: {
        community: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return await enrichAndFormatPosts(posts, currentUser);
}

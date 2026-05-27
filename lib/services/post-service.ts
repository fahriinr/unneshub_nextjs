import { prisma } from "../prisma";
import { auth } from "../auth/auth";
import { headers } from "next/headers";
import { requireAuth, requireCommunityMember } from "../auth/community-permissions";
import { CreatePostInput, UpdatePostInput } from "../validations/post";
import { Prisma, UserRole } from "../../app/generated/prisma/client";

export type PostWithRelations = Prisma.PostGetPayload<{
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

interface CurrentUserSession {
  id: string;
  role: UserRole;
}

export interface PostPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  isCommunityAdmin: boolean;
  isCommunityOwner: boolean;
}

export type PostWithPermissions<T> = T & {
  permissions: PostPermissions;
};

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

function maskAnonymousAuthor<T extends PostWithRelations>(
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

async function enrichPost<T extends { userId: string; communityId: string }>(
  post: T,
  currentUser: CurrentUserSession | null
): Promise<PostWithPermissions<T>> {
  if (!currentUser) {
    return {
      ...post,
      permissions: {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        isCommunityAdmin: false,
        isCommunityOwner: false,
      },
    };
  }

  const isAuthor = post.userId === currentUser.id;
  const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";

  const community = await prisma.community.findUnique({
    where: { id: post.communityId },
    select: { creatorId: true },
  });

  const isOwner = community ? community.creatorId === currentUser.id : false;

  let isAdmin = isOwner;
  if (community && !isOwner) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: post.communityId,
          userId: currentUser.id,
        },
      },
      select: { role: true, status: true },
    });
    if (membership && membership.status === "APPROVED" && membership.role === "ADMIN") {
      isAdmin = true;
    }
  }

  return {
    ...post,
    permissions: {
      canEdit: isAuthor,
      canDelete: isAuthor || isAdmin || isGlobalAdmin,
      canManageMembers: false,
      isCommunityAdmin: isAdmin,
      isCommunityOwner: isOwner,
    },
  };
}

async function enrichPosts<T extends { userId: string; communityId: string }>(
  posts: T[],
  currentUser: CurrentUserSession | null
): Promise<PostWithPermissions<T>[]> {
  if (posts.length === 0) return [];
  if (!currentUser) {
    return posts.map(p => ({
      ...p,
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
  const communityIds = Array.from(new Set(posts.map(p => p.communityId)));

  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, creatorId: true },
  });
  const communityCreatorMap = new Map(communities.map(c => [c.id, c.creatorId]));

  const memberships = await prisma.communityMember.findMany({
    where: {
      communityId: { in: communityIds },
      userId: currentUser.id,
      status: "APPROVED",
    },
    select: { communityId: true, role: true },
  });
  const membershipMap = new Map(memberships.map(m => [m.communityId, m.role]));

  return posts.map(post => {
    const isAuthor = post.userId === currentUser.id;
    const creatorId = communityCreatorMap.get(post.communityId);
    const isOwner = creatorId === currentUser.id;
    const memberRole = membershipMap.get(post.communityId);
    const isAdmin = isOwner || memberRole === "ADMIN";

    return {
      ...post,
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

export async function createPost(data: CreatePostInput): Promise<PostWithPermissions<PostWithRelations>> {
  // Checks if user is authenticated and an approved member of the community
  const { user } = await requireCommunityMember(data.communityId);

  const post = await prisma.post.create({
    data: {
      content: data.content,
      imageUrl: data.imageUrl || null,
      isAnonymous: data.isAnonymous ?? false,
      communityId: data.communityId,
      userId: user.id,
      title: data.title || null,
      tag: data.tag || null,
    },
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
  });

  const currentUser = await getCurrentUserOrNull();
  const enriched = await enrichPost(post, currentUser);
  return maskAnonymousAuthor(enriched, currentUser);
}

export interface GetPostsOptions {
  communityId?: string;
  limit?: number;
  page?: number;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<PostWithPermissions<PostWithRelations>[]> {
  const { communityId, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {};
  if (communityId) {
    where.communityId = communityId;
  }

  const posts = await prisma.post.findMany({
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

  const currentUser = await getCurrentUserOrNull();
  const masked = posts.map((post) => maskAnonymousAuthor(post, currentUser));
  return await enrichPosts(masked, currentUser);
}

export async function getPostById(id: string): Promise<PostWithPermissions<PostWithRelations> | null> {
  const post = await prisma.post.findUnique({
    where: { id },
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
  });

  if (!post) return null;

  const currentUser = await getCurrentUserOrNull();
  const masked = maskAnonymousAuthor(post, currentUser);
  return await enrichPost(masked, currentUser);
}

export async function updatePost(id: string, data: UpdatePostInput): Promise<PostWithPermissions<PostWithRelations>> {
  const user = await requireAuth();

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw new Error("NotFound: Post not found");
  }

  if (post.userId !== user.id) {
    throw new Error("Forbidden: You are not the owner of this post");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      content: data.content,
      imageUrl: data.imageUrl !== undefined ? (data.imageUrl || null) : undefined,
      isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : undefined,
      title: data.title !== undefined ? (data.title || null) : undefined,
      tag: data.tag !== undefined ? (data.tag || null) : undefined,
    },
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
  });

  const currentUser = await getCurrentUserOrNull();
  const masked = maskAnonymousAuthor(updatedPost, currentUser);
  return await enrichPost(masked, currentUser);
}

export async function deletePost(id: string): Promise<PostWithPermissions<PostWithRelations>> {
  const user = await requireAuth();

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw new Error("NotFound: Post not found");
  }

  if (post.userId !== user.id) {
    throw new Error("Forbidden: You are not the owner of this post");
  }

  const deletedPost = await prisma.post.delete({
    where: { id },
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
  });

  const currentUser = await getCurrentUserOrNull();
  const masked = maskAnonymousAuthor(deletedPost, currentUser);
  return await enrichPost(masked, currentUser);
}

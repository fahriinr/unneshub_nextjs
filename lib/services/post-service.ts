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

function maskAnonymousAuthor(
  post: PostWithRelations,
  currentUser: CurrentUserSession | null
): PostWithRelations {
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

export async function createPost(data: CreatePostInput): Promise<PostWithRelations> {
  // Checks if user is authenticated and an approved member of the community
  const { user } = await requireCommunityMember(data.communityId);

  return await prisma.post.create({
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
}

export interface GetPostsOptions {
  communityId?: string;
  limit?: number;
  page?: number;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<PostWithRelations[]> {
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
  return posts.map((post) => maskAnonymousAuthor(post, currentUser));
}

export async function getPostById(id: string): Promise<PostWithRelations | null> {
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
  return maskAnonymousAuthor(post, currentUser);
}

export async function updatePost(id: string, data: UpdatePostInput): Promise<PostWithRelations> {
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
  return maskAnonymousAuthor(updatedPost, currentUser);
}

export async function deletePost(id: string): Promise<PostWithRelations> {
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
  return maskAnonymousAuthor(deletedPost, currentUser);
}

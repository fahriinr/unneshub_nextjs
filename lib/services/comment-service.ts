import { prisma } from "../prisma";
import { requireAuth } from "../auth/community-permissions";
import { CreateCommentInput, UpdateCommentInput } from "../validations/comment";
import { Prisma, UserRole } from "../../app/generated/prisma/client";
import { auth } from "../auth/auth";
import { headers } from "next/headers";

export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        role: true;
      };
    };
    replies: {
      include: {
        author: {
          select: {
            id: true;
            name: true;
            email: true;
            image: true;
            role: true;
          };
        };
      };
    };
  };
}>;

export interface CommentPermissions {
  canEdit: boolean;
  canDelete: boolean;
}

export type CommentWithPermissions<T> = T & {
  permissions: CommentPermissions;
  replies?: CommentWithPermissions<CommentWithRelations["replies"][number]>[];
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

async function enrichCommentData<T extends { userId: string; postId: string }>(
  comment: T,
  currentUser: CurrentUserSession | null
): Promise<CommentWithPermissions<T>> {
  if (!currentUser) {
    return {
      ...comment,
      permissions: {
        canEdit: false,
        canDelete: false,
      },
    };
  }

  const isAuthor = comment.userId === currentUser.id;
  const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";

  // Fetch the post's community to check admin/owner status
  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    select: { communityId: true },
  });

  let isCommunityAdmin = false;
  if (post) {
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
    isCommunityAdmin = isAdmin;
  }

  return {
    ...comment,
    permissions: {
      canEdit: isAuthor,
      canDelete: isAuthor || isCommunityAdmin || isGlobalAdmin,
    },
  };
}

async function enrichCommentsList(
  comments: CommentWithRelations[],
  postId: string,
  currentUser: CurrentUserSession | null
): Promise<CommentWithPermissions<CommentWithRelations>[]> {
  if (comments.length === 0) return [];
  if (!currentUser) {
    return comments.map(c => ({
      ...c,
      permissions: { canEdit: false, canDelete: false },
      replies: c.replies.map(r => ({
        ...r,
        permissions: { canEdit: false, canDelete: false }
      }))
    }));
  }

  const currentUserId = currentUser.id;
  const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";

  // Fetch community details for admin/owner check
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { communityId: true },
  });

  let isCommunityAdmin = false;
  if (post) {
    const community = await prisma.community.findUnique({
      where: { id: post.communityId },
      select: { creatorId: true },
    });
    const isOwner = community ? community.creatorId === currentUserId : false;

    let isAdmin = isOwner;
    if (community && !isOwner) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: post.communityId,
            userId: currentUserId,
          },
        },
        select: { role: true, status: true },
      });
      if (membership && membership.status === "APPROVED" && membership.role === "ADMIN") {
        isAdmin = true;
      }
    }
    isCommunityAdmin = isAdmin;
  }

  const canDeleteAny = isCommunityAdmin || isGlobalAdmin;

  return comments.map(c => {
    const canEdit = c.userId === currentUserId;
    const canDelete = canEdit || canDeleteAny;

    return {
      ...c,
      permissions: { canEdit, canDelete },
      replies: c.replies.map(r => ({
        ...r,
        permissions: {
          canEdit: r.userId === currentUserId,
          canDelete: r.userId === currentUserId || canDeleteAny,
        }
      }))
    };
  });
}

export async function createComment(data: CreateCommentInput): Promise<CommentWithPermissions<CommentWithRelations>> {
  const user = await requireAuth();

  // Validate parent comment and nesting depth if parentId is provided
  if (data.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });

    if (!parentComment) {
      throw new Error("NotFound: Parent comment not found");
    }

    // Only allow 1 level of nesting (cannot reply to a reply)
    if (parentComment.parentId !== null) {
      throw new Error("Forbidden: Cannot reply to a nested comment. Nesting limit reached.");
    }
  }

  // Verify post exists
  const postExists = await prisma.post.findUnique({
    where: { id: data.postId },
    select: { id: true },
  });
  if (!postExists) {
    throw new Error("NotFound: Post not found");
  }

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      postId: data.postId,
      parentId: data.parentId || null,
      userId: user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const currentUser = await getCurrentUserOrNull();
  return await enrichCommentData(comment, currentUser);
}

export interface GetCommentsOptions {
  limit?: number;
  page?: number;
}

export async function getCommentsByPost(
  postId: string,
  options: GetCommentsOptions = {}
): Promise<CommentWithPermissions<CommentWithRelations>[]> {
  const { limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  // Verify post exists
  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!postExists) {
    throw new Error("NotFound: Post not found");
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null, // Only fetch top-level comments
    },
    take: limit,
    skip,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const currentUser = await getCurrentUserOrNull();
  return await enrichCommentsList(comments, postId, currentUser);
}

export async function updateComment(
  id: string,
  data: UpdateCommentInput
): Promise<CommentWithPermissions<CommentWithRelations>> {
  const user = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    throw new Error("NotFound: Comment not found");
  }

  if (comment.userId !== user.id) {
    throw new Error("Forbidden: You are not the owner of this comment");
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: {
      content: data.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const currentUser = await getCurrentUserOrNull();
  return await enrichCommentData(updatedComment, currentUser);
}

export async function deleteComment(id: string): Promise<Prisma.BatchPayload | { id: string }> {
  const user = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, userId: true, postId: true },
  });

  if (!comment) {
    throw new Error("NotFound: Comment not found");
  }

  const isAuthor = comment.userId === user.id;

  if (!isAuthor) {
    // Check if user is community admin/owner or global admin
    const isGlobalAdmin = user.role === "GLOBAL_ADMIN";

    let isCommunityAdmin = false;
    const post = await prisma.post.findUnique({
      where: { id: comment.postId },
      select: { communityId: true },
    });

    if (post) {
      const community = await prisma.community.findUnique({
        where: { id: post.communityId },
        select: { creatorId: true },
      });
      const isOwner = community ? community.creatorId === user.id : false;

      let isAdmin = isOwner;
      if (community && !isOwner) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: post.communityId,
              userId: user.id,
            },
          },
          select: { role: true, status: true },
        });
        if (membership && membership.status === "APPROVED" && membership.role === "ADMIN") {
          isAdmin = true;
        }
      }
      isCommunityAdmin = isAdmin;
    }

    if (!isCommunityAdmin && !isGlobalAdmin) {
      throw new Error("Forbidden: You are not the owner of this comment");
    }
  }

  await prisma.comment.delete({
    where: { id },
  });

  return { id };
}

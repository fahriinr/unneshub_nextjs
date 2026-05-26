import { prisma } from "../prisma";
import { requireAuth } from "../auth/community-permissions";
import { CreateCommentInput, UpdateCommentInput } from "../validations/comment";
import { Prisma } from "../../app/generated/prisma/client";

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

export async function createComment(data: CreateCommentInput): Promise<CommentWithRelations> {
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

  return await prisma.comment.create({
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
}

export interface GetCommentsOptions {
  limit?: number;
  page?: number;
}

export async function getCommentsByPost(
  postId: string,
  options: GetCommentsOptions = {}
): Promise<CommentWithRelations[]> {
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

  return await prisma.comment.findMany({
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
}

export async function updateComment(
  id: string,
  data: UpdateCommentInput
): Promise<CommentWithRelations> {
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

  return await prisma.comment.update({
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
}

export async function deleteComment(id: string): Promise<Prisma.BatchPayload | { id: string }> {
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

  // Delete comment
  await prisma.comment.delete({
    where: { id },
  });

  return { id };
}

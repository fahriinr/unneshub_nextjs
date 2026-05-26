import { prisma } from "../prisma";
import { requireAuth } from "../auth/community-permissions";
import { auth } from "../auth/auth";
import { headers } from "next/headers";

export async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  const user = await requireAuth();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new Error("NotFound: Post not found");
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: user.id,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });
    return { liked: false };
  } else {
    try {
      await prisma.like.create({
        data: {
          postId,
          userId: user.id,
        },
      });
      return { liked: true };
    } catch (error) {
      // Handle race condition unique constraint violation
      return { liked: true };
    }
  }
}

export async function getPostLikeCount(postId: string): Promise<{ count: number }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new Error("NotFound: Post not found");
  }

  const count = await prisma.like.count({
    where: { postId },
  });

  return { count };
}

export async function hasUserLikedPost(postId: string): Promise<{ liked: boolean }> {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // Fail silently for unauthenticated/server build contexts
  }

  if (!session || !session.user) {
    return { liked: false };
  }

  const like = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  return { liked: !!like };
}

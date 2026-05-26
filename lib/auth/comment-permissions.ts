import { prisma } from "../prisma";
import { requireAuth } from "./community-permissions";

export async function requireCommentOwner(commentId: string) {
  const user = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    throw new Error("NotFound: Comment not found");
  }

  if (comment.userId !== user.id) {
    throw new Error("Forbidden: You must be the owner of this comment");
  }

  return { user, comment };
}

import { prisma } from "../prisma";
import { requireAuth, requireCommunityMember } from "./community-permissions";

export async function requireAuthenticatedMember(communityId: string) {
  return await requireCommunityMember(communityId);
}

export async function requirePostOwner(postId: string) {
  const user = await requireAuth();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) {
    throw new Error("NotFound: Post not found");
  }

  if (post.userId !== user.id) {
    throw new Error("Forbidden: You must be the owner of this post");
  }

  return { user, post };
}

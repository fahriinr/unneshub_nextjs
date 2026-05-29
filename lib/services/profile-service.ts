import { prisma } from "../prisma";
import { auth } from "../auth/auth";
import { headers } from "next/headers";
import { requireAuth } from "../auth/community-permissions";
import { UpdateProfileInput } from "../validations/profile";
import { UserRole } from "../../app/generated/prisma/client";

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

export async function getCurrentUserProfile() {
  const user = await requireAuth();
  return getUserProfileById(user.id);
}

export async function getUserProfileById(id: string) {
  const currentUser = await getCurrentUserOrNull();
  
  // Only the owner or a GLOBAL_ADMIN can see their anonymous posts
  const isOwner = currentUser?.id === id;
  const isGlobalAdmin = currentUser?.role === "GLOBAL_ADMIN";
  const showAnonymous = isOwner || isGlobalAdmin;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        where: {
          status: "APPROVED",
        },
        include: {
          community: true,
        },
      },
      createdCommunities: {
        where: {
          status: "APPROVED",
        },
      },
      posts: {
        where: showAnonymous ? {} : { isAnonymous: false },
        take: 10,
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });

  if (!user) {
    throw new Error("NotFound: User profile not found");
  }

  return user;
}

export async function updateProfile(id: string, data: UpdateProfileInput) {
  const user = await requireAuth();

  if (user.id !== id) {
    throw new Error("Forbidden: You can only update your own profile");
  }

  // Parse angkatan to Int?
  let angkatanVal: number | null | undefined = undefined;
  if (data.angkatan !== undefined) {
    if (data.angkatan === "" || data.angkatan === null) {
      angkatanVal = null;
    } else {
      const parsed = parseInt(data.angkatan, 10);
      if (isNaN(parsed)) {
        throw new Error("BadRequest: Angkatan must be a valid number");
      }
      angkatanVal = parsed;
    }
  }

  return await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      image: data.profileImage !== undefined ? (data.profileImage || null) : undefined,
      nim: data.nim !== undefined ? (data.nim || null) : undefined,
      fakultas: data.fakultas !== undefined ? (data.fakultas || null) : undefined,
      prodi: data.prodi !== undefined ? (data.prodi || null) : undefined,
      angkatan: angkatanVal,
    },
    include: {
      memberships: {
        where: {
          status: "APPROVED",
        },
        include: {
          community: true,
        },
      },
      createdCommunities: {
        where: {
          status: "APPROVED",
        },
      },
      posts: {
        take: 10,
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });
}

export interface GetUserPostsOptions {
  userId: string;
  limit?: number;
  page?: number;
}

export async function getUserPosts(options: GetUserPostsOptions) {
  const { userId, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error("NotFound: User not found");
  }

  const currentUser = await getCurrentUserOrNull();
  const isOwner = currentUser?.id === userId;
  const isGlobalAdmin = currentUser?.role === "GLOBAL_ADMIN";
  const showAnonymous = isOwner || isGlobalAdmin;

  const posts = await prisma.post.findMany({
    where: {
      userId,
      ...(showAnonymous ? {} : { isAnonymous: false }),
    },
    take: limit,
    skip,
    orderBy: {
      createdAt: "desc",
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

  return posts;
}

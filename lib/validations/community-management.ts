import { z } from "zod";
import { CommunityRole } from "../../app/generated/prisma/client";

export const updateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  rules: z
    .string()
    .max(1000, "Rules cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  coverImage: z
    .string()
    .url("Invalid cover image URL format")
    .optional()
    .or(z.literal("")),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.nativeEnum(CommunityRole),
});

export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

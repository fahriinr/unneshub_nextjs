import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),
  slug: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and contain only alphanumeric characters and hyphens"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  rules: z
    .string()
    .max(1000, "Rules cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  category: z.enum(["AKADEMIK", "HOBI", "KARIR", "ORGANISASI", "EVENT"], {
    message: "Invalid community category",
  }),
  tags: z
    .array(z.string().max(30, "Each tag cannot exceed 30 characters"))
    .max(10, "Cannot have more than 10 tags")
    .optional()
    .default([]),
});

export const updateCommunitySchema = createCommunitySchema.partial();

export const joinCommunitySchema = z.object({
  communityId: z.string().uuid("Invalid community ID format"),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type JoinCommunityInput = z.infer<typeof joinCommunitySchema>;

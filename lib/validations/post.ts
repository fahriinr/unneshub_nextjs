import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Content must be at least 1 character")
    .max(2000, "Content cannot exceed 2000 characters"),
  imageUrl: z
    .string()
    .url("Invalid image URL format")
    .optional()
    .or(z.literal("")),
  isAnonymous: z
    .boolean()
    .optional()
    .default(false),
  communityId: z
    .string()
    .uuid("Invalid community ID format"),
  title: z
    .string()
    .max(100, "Title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  tag: z
    .string()
    .max(30, "Tag cannot exceed 30 characters")
    .optional()
    .or(z.literal("")),
  eventName: z
    .string()
    .max(100, "Event name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  eventDate: z
    .string()
    .max(20, "Event date cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
  eventTime: z
    .string()
    .max(20, "Event time cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
  eventLocation: z
    .string()
    .max(200, "Event location cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
});

export const updatePostSchema = createPostSchema.partial().omit({ communityId: true });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

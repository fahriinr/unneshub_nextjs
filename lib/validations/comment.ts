import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment must be at least 1 character")
    .max(1000, "Comment cannot exceed 1000 characters"),
  postId: z
    .string()
    .uuid("Invalid post ID format"),
  parentId: z
    .string()
    .uuid("Invalid parent comment ID format")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const updateCommentSchema = createCommentSchema.pick({ content: true });

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

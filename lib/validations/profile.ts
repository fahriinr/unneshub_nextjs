import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),
  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
  profileImage: z
    .string()
    .url("Invalid profile image URL format")
    .optional()
    .or(z.literal("")),
  prodi: z
    .string()
    .max(100, "Program studi cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  angkatan: z
    .string()
    .max(20, "Angkatan cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

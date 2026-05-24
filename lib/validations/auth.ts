import { z } from "zod";

const UNNES_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@students\.unnes\.ac\.id$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi!")
    .regex(
      UNNES_EMAIL_REGEX,
      "Email harus menggunakan domain @students.unnes.ac.id",
    ),
  password: z.string().min(1, "Password wajib diisi!"),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi!"),
    nim: z.string().min(8, "NIM minimal 8 karakter!"),
    fakultas: z.string().min(1, "Fakultas wajib dipilih!"),
    email: z
      .string()
      .min(1, "Email wajib diisi!")
      .regex(
        UNNES_EMAIL_REGEX,
        "Email harus menggunakan domain @students.unnes.ac.id",
      ),
    password: z
      .string()
      .min(1, "Password wajib diisi!")
      .min(8, "Password minimal 8 karakter!"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi!"),
    agreed: z.literal(true, {
      error: "Anda harus menyetujui Ketentuan Layanan.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok!",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

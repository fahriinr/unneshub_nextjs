import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "MAHASISWA",
        input: false,
      },
      isVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = ctx.body?.email;
        const unnesEmailRegex = /^[a-zA-Z0-9._%+-]+@students\.unnes\.ac\.id$/;
        if (!email || !unnesEmailRegex.test(email)) {
          throw new APIError("BAD_REQUEST", {
            message: "Email must match @students.unnes.ac.id domain pattern.",
          });
        }
      }
    }),
  },
});

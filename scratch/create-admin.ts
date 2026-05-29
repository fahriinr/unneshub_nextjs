import "dotenv/config";
import { auth } from "../lib/auth/auth";
import { prisma } from "../lib/prisma";

async function main() {
  try {
    // 1. Sign up the user via Better Auth
    const user = await auth.api.signUpEmail({
      body: {
        email: "admin@students.unnes.ac.id",
        password: "atmin123",
        name: "Global Admin",
      },
    });
    console.log("User created:", user);
  } catch (e) {
    console.log("User might already exist, continuing...");
  }

  // 2. Update the role of the user to GLOBAL_ADMIN
  const updatedUser = await prisma.user.update({
    where: { email: "admin@students.unnes.ac.id" },
    data: {
      role: "GLOBAL_ADMIN",
    },
  });
  console.log("Updated user role to GLOBAL_ADMIN:", updatedUser);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

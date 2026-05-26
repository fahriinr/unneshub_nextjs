import { requireAuth } from "./community-permissions";

export async function requireAuthenticatedUser() {
  return await requireAuth();
}

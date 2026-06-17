import { z } from "zod";

export const currentUserResponseSchema = z.object({
  memberships: z.array(
    z.object({
      organization: z.object({
        id: z.string(),
        name: z.string()
      }),
      organizationId: z.string(),
      projectIds: z.array(z.string()),
      projects: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          organizationId: z.string()
        })
      ),
      role: z.enum(["owner", "admin", "member", "viewer"])
    })
  ),
  user: z.object({
    email: z.string().email(),
    id: z.string(),
    name: z.string().optional()
  })
});

export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;

import type { ApiClient } from "@/src/lib/api/api-client";
import { z } from "zod";

const onboardingStateResponseSchema = z.object({
  onboardingState: z.object({
    dismissedAt: z.string().datetime().optional(),
    organizationId: z.string(),
    userId: z.string()
  })
});

export function createOnboardingClient(apiClient: ApiClient) {
  return {
    async updateOnboardingState(organizationId: string, dismissed: boolean) {
      return onboardingStateResponseSchema.parse(
        await apiClient.request({
          body: { dismissed },
          method: "POST",
          path: `/api/v1/organizations/${organizationId}/onboarding-state` as never
        })
      );
    }
  };
}

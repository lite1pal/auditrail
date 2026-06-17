import { z } from "zod";

const issueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])).default([]),
  message: z.string(),
  code: z.string()
});

const apiErrorBodySchema = z.object({
  error: z.string(),
  issues: z.array(issueSchema).optional()
});

export type ApiIssue = z.infer<typeof issueSchema>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly issues: ApiIssue[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = await readJson(response);
  const parsed = apiErrorBodySchema.safeParse(body);

  if (!parsed.success) {
    return new ApiError(response.statusText, response.status, "api_error");
  }

  return new ApiError(
    parsed.data.error,
    response.status,
    parsed.data.error,
    parsed.data.issues ?? []
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

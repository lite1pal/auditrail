import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createTodoInputSchema, updateTodoInputSchema } from "@auditrail/domain/generated/todo";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import type { TodoRecord } from "@/src/features/todo/domain/schemas";
import { createServerApiClient } from "@/src/lib/api/server-api-client";
import { resolveWorkspaceContext } from "@/src/features/organizations/domain/workspace";
import { createResourceClient } from "@/src/features/todo/api/todo-client";
export async function loadTodoWorkspacePage(
  searchParams: Record<string, string | string[] | undefined>,
  dependencies: {
    currentUser: CurrentUserResponse;
  }
) {
  const workspace = resolveWorkspaceContext(
    dependencies.currentUser,
    {
      organizationId: getSearchValue(searchParams.organizationId),
      projectId: getSearchValue(searchParams.projectId)
    },
    {
      requiredProductId: "todo"
    }
  );
  const items = workspace.activeOrganizationId
    ? (await createResourceClient(createServerApiClient()).list(
        workspace.activeOrganizationId
      )).items
    : [];
  const relationPresentations = {};
  return {
    draftValues: readDraftValues(searchParams),
    feedback: readFeedback(searchParams),
    items,
    relationPresentations,
    workspace
  };
}
export async function loadTodoWorkspaceDetailPage(
  input: {
    todoId: string;
    searchParams: Record<string, string | string[] | undefined>;
  },
  dependencies: {
    currentUser: CurrentUserResponse;
  }
) {
  const workspace = resolveWorkspaceContext(
    dependencies.currentUser,
    {
      organizationId: getSearchValue(input.searchParams.organizationId),
      projectId: getSearchValue(input.searchParams.projectId)
    },
    {
      requiredProductId: "todo"
    }
  );
  const item = workspace.activeOrganizationId
    ? await createResourceClient(createServerApiClient()).get(
        workspace.activeOrganizationId,
        input.todoId
      )
    : null;
  const relationPresentations = {};
  return {
    draftValues: readDraftValues(input.searchParams),
    feedback: readFeedback(input.searchParams),
    item,
    relationPresentations,
    workspace
  };
}
export async function createTodoWorkspaceAction(formData: FormData) {
  "use server";
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));
  try {
    const payload = createTodoInputSchema.parse({
      title: String(formData.get("title") ?? ""),
      details: coerceString(formData.get("details")),
      status: String(formData.get("status") ?? ""),
      dueAt: coerceDatetime(formData.get("dueAt")),
    });
    await createResourceClient(createServerApiClient()).create(
      organizationId,
      payload
    );
    const nextPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId);
    revalidatePath(nextPath);
    redirect(nextPath as never);
  } catch (error) {
    redirect(
      buildFailurePath("/todo/todos", organizationId, projectId, {
        draftValues: buildDraftValues(formData),
        feedback: getFeedbackMessage(error, "Unable to create this record right now.")
      }) as never
    );
  }
}
export async function updateTodoWorkspaceAction(formData: FormData) {
  "use server";
  const todoId = String(formData.get("todoId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));
  try {
    const payload = updateTodoInputSchema.parse({
      title: String(formData.get("title") ?? ""),
      details: coerceString(formData.get("details")),
      status: String(formData.get("status") ?? ""),
      dueAt: coerceDatetime(formData.get("dueAt")),
    });
    await createResourceClient(createServerApiClient()).update(
      organizationId,
      todoId,
      payload
    );
    const nextPath = buildResourcePath("/todo/todos", todoId, organizationId, projectId);
    const listPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId);
    revalidatePath(nextPath);
    revalidatePath(listPath);
    redirect(nextPath as never);
  } catch (error) {
    redirect(
      buildFailurePath(buildResourceEditPath("/todo/todos", todoId), organizationId, projectId, {
        draftValues: buildDraftValues(formData),
        feedback: getFeedbackMessage(error, "Unable to save changes right now.")
      }) as never
    );
  }
}

export async function deleteTodoWorkspaceAction(formData: FormData) {
  "use server";

  const todoId = String(formData.get("todoId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));

  try {
    await createResourceClient(createServerApiClient()).delete(
      organizationId,
      todoId
    );

    const listPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId);
    revalidatePath(listPath);
    redirect(listPath as never);
  } catch (error) {
    redirect(
      buildFailurePath(buildResourcePath("/todo/todos", todoId, organizationId, projectId), organizationId, projectId, {
        feedback: getFeedbackMessage(error, "Unable to delete this record right now.")
      }) as never
    );
  }
}
type TodoRelationPresentation = {
  href?: string;
  label: string;
};
type TodoRelationPresentations = Record<
  string,
  Partial<Record<string, TodoRelationPresentation>>
>;
async function resolveTodoRelationPresentations(input: {
  items: readonly TodoRecord[];
  organizationId?: string;
  projectId?: string;
  workspace: ReturnType<typeof resolveWorkspaceContext>;
}): Promise<TodoRelationPresentations> {
  const presentations: TodoRelationPresentations = {};
  if (input.items.length === 0) {
    return presentations;
  }
  for (const item of input.items) {
    presentations[item.id] = {};
  }
  return compactRelationPresentations(presentations);
}
function compactRelationPresentations(
  presentations: TodoRelationPresentations
): TodoRelationPresentations {
  return Object.fromEntries(
    Object.entries(presentations).map(([recordId, value]) => [
      recordId,
      Object.fromEntries(
        Object.entries(value).filter(([, relation]) => relation !== undefined)
      )
    ])
  ) as TodoRelationPresentations;
}
function buildWorkspaceSuffix(
  organizationId: string,
  projectId?: string
) {
  const query = new URLSearchParams({ organizationId });
  if (projectId) {
    query.set("projectId", projectId);
  }
  return `?${query.toString()}`;
}
function buildResourcePath(
  basePath: string,
  id: string,
  organizationId: string,
  projectId?: string
) {
  return `${basePath}/${id}${buildWorkspaceSuffix(organizationId, projectId)}`;
}
function buildResourceEditPath(basePath: string, id: string) {
  return `${basePath}/${id}/edit`;
}
function buildFailurePath(
  basePath: string,
  organizationId: string,
  projectId: string | undefined,
  input: {
    draftValues?: Record<string, string | undefined>;
    feedback: string;
  }
) {
  const query = new URLSearchParams({ organizationId });
  if (projectId) {
    query.set("projectId", projectId);
  }
  query.set("feedback", input.feedback);
  for (const [key, value] of Object.entries(input.draftValues ?? {})) {
    if (value !== undefined && value.length > 0) {
      query.set(`draft_${key}`, value);
    }
  }
  return `${basePath}?${query.toString()}`;
}
function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function readFeedback(searchParams: Record<string, string | string[] | undefined>) {
  const feedback = getSearchValue(searchParams.feedback);
  return feedback ? feedback : undefined;
}
function readDraftValues(searchParams: Record<string, string | string[] | undefined>) {
  return compactDraftValues({
    title: getSearchValue(searchParams.draft_title) ?? undefined,
    details: getSearchValue(searchParams.draft_details) ?? undefined,
    status: ["todo","done"].includes(getSearchValue(searchParams.draft_status) ?? "") ? (getSearchValue(searchParams.draft_status) as "todo" | "done") : undefined,
    dueAt: getSearchValue(searchParams.draft_dueAt) ?? undefined,
  });
}
function buildDraftValues(formData: FormData) {
  return {
    title: coerceString(formData.get("title")),
    details: coerceString(formData.get("details")),
    status: coerceString(formData.get("status")),
    dueAt: coerceString(formData.get("dueAt")),
  };
}
function compactDraftValues<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
function coerceString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
function coerceDatetime(value: FormDataEntryValue | null) {
  const trimmed = coerceString(value);
  return trimmed ? new Date(trimmed).toISOString() : undefined;
}
function coerceBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}
function getFeedbackMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return issue?.message ?? fallback;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
}

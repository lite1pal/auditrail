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
        workspace.activeOrganizationId,
        { archived: readArchivedFilter(searchParams) }
      )).items
    : [];
  const relationPresentations = {};
  return {
    archivedFilter: readArchivedFilter(searchParams),
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
    archivedFilter: readArchivedFilter(input.searchParams),
    relationPresentations,
    workspace
  };
}
export async function createTodoWorkspaceAction(formData: FormData) {
  "use server";
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));
  const archived = readArchivedFilterFromFormData(formData);
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
    const nextPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId, archived);
    revalidatePath(nextPath);
    redirect(nextPath as never);
  } catch (error) {
    redirect(
      buildFailurePath("/todo/todos", organizationId, projectId, archived, {
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
  const archived = readArchivedFilterFromFormData(formData);
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
    const nextPath = buildResourcePath("/todo/todos", todoId, organizationId, projectId, archived);
    const listPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId, archived);
    revalidatePath(nextPath);
    revalidatePath(listPath);
    redirect(nextPath as never);
  } catch (error) {
    redirect(
      buildFailurePath(buildResourceEditPath("/todo/todos", todoId), organizationId, projectId, archived, {
        draftValues: buildDraftValues(formData),
        feedback: getFeedbackMessage(error, "Unable to save changes right now.")
      }) as never
    );
  }
}

export async function archiveTodoWorkspaceAction(formData: FormData) {
  "use server";

  const todoId = String(formData.get("todoId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));
  const archived = readArchivedFilterFromFormData(formData);

  try {
    await createResourceClient(createServerApiClient()).archive(
      organizationId,
      todoId
    );

    const listPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId, archived);
    const detailPath = buildResourcePath(
      "/todo/todos",
      todoId,
      organizationId,
      projectId,
      archived === "only" ? "only" : "exclude"
    );
    revalidatePath(listPath);
    revalidatePath(detailPath);
    redirect(listPath as never);
  } catch (error) {
    redirect(
      buildFailurePath(buildResourcePath("/todo/todos", todoId, organizationId, projectId, archived), organizationId, projectId, archived, {
        feedback: getFeedbackMessage(error, "Unable to archive this record right now.")
      }) as never
    );
  }
}

export async function unarchiveTodoWorkspaceAction(formData: FormData) {
  "use server";

  const todoId = String(formData.get("todoId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const projectId = coerceString(formData.get("projectId"));
  const archived = readArchivedFilterFromFormData(formData);

  try {
    await createResourceClient(createServerApiClient()).unarchive(
      organizationId,
      todoId
    );

    const listPath = "/todo/todos" + buildWorkspaceSuffix(organizationId, projectId, archived === "only" ? "exclude" : archived);
    revalidatePath(listPath);
    redirect(buildResourcePath("/todo/todos", todoId, organizationId, projectId, "exclude") as never);
  } catch (error) {
    redirect(
      buildFailurePath(buildResourcePath("/todo/todos", todoId, organizationId, projectId, archived), organizationId, projectId, archived, {
        feedback: getFeedbackMessage(error, "Unable to restore this record right now.")
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
  projectId?: string,
  archived?: "exclude" | "include" | "only"
) {
  const query = new URLSearchParams({ organizationId });
  if (projectId) {
    query.set("projectId", projectId);
  }

  if (archived) {
    query.set("archived", archived);
  }
  return `?${query.toString()}`;
}
function buildResourcePath(
  basePath: string,
  id: string,
  organizationId: string,
  projectId?: string,
  archived?: "exclude" | "include" | "only"
) {
  return `${basePath}/${id}${buildWorkspaceSuffix(organizationId, projectId, archived)}`;
}
function buildResourceEditPath(basePath: string, id: string) {
  return `${basePath}/${id}/edit`;
}
function buildFailurePath(
  basePath: string,
  organizationId: string,
  projectId: string | undefined,
  archived: "exclude" | "include" | "only" | undefined,
  input: {
    draftValues?: Record<string, string | undefined>;
    feedback: string;
  }
) {
  const query = new URLSearchParams({ organizationId });
  if (projectId) {
    query.set("projectId", projectId);
  }

  if (archived) {
    query.set("archived", archived);
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

function readArchivedFilter(
  searchParams: Record<string, string | string[] | undefined>
): "exclude" | "include" | "only" {
  const archived = getSearchValue(searchParams.archived);

  return archived === "include" || archived === "only" ? archived : "exclude";
}

function readArchivedFilterFromFormData(
  formData: FormData
): "exclude" | "include" | "only" {
  const value = coerceString(formData.get("archived"));

  return value === "include" || value === "only" ? value : "exclude";
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

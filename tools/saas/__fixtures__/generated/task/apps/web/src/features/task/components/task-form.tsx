import type { ReactNode } from "react";

import type { TaskRecord } from "../domain/schemas.js";

export function TaskForm(input: {
  action?: (formData: FormData) => void | Promise<void>;
  children?: ReactNode;
  defaultValues?: Partial<TaskRecord>;
  submitLabel?: string;
}) {
  return (
    <form action={input.action} className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-4">
      {input.children}
      <label key={"title"} className="grid gap-2">
        <span>Title</span>
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          defaultValue={input.defaultValues?.title ?? ""}
          name="title"
          required
          type="text"
        />
      </label>
      <label key={"status"} className="grid gap-2">
        <span>Status</span>
        <select
          className="rounded-md border border-[var(--border)] px-3 py-2"
          defaultValue={input.defaultValues?.status ?? "todo"}
          name="status"
          required
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </label>
      <label key={"dueAt"} className="grid gap-2">
        <span>Due At</span>
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          defaultValue={toDateTimeLocalValue(input.defaultValues?.dueAt)}
          name="dueAt"
          
          type="datetime-local"
        />
      </label>
      <label key={"projectId"} className="grid gap-2">
        <span>Project Id</span>
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          defaultValue={input.defaultValues?.projectId ?? ""}
          name="projectId"
          required
          type="text"
        />
      </label>
      <label key={"assigneeId"} className="grid gap-2">
        <span>Assignee Id</span>
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          defaultValue={input.defaultValues?.assigneeId ?? ""}
          name="assigneeId"
          
          type="text"
        />
      </label>
      <button className="w-fit rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium" type="submit">{input.submitLabel ?? "Save Task"}</button>
    </form>
  );
}

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

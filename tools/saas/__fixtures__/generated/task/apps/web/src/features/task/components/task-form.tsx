export function TaskForm() {
  return (
    <form className="grid gap-4">
      <label key={"title"} className="flex flex-col gap-2">
        <span>Title</span>
        <input name="title" type="text" />
      </label>
      <label key={"status"} className="flex flex-col gap-2">
        <span>Status</span>
        <input name="status" type="text" />
      </label>
      <label key={"dueAt"} className="flex flex-col gap-2">
        <span>Due At</span>
        <input name="dueAt" type="datetime-local" />
      </label>
      <label key={"projectId"} className="flex flex-col gap-2">
        <span>Project Id</span>
        <input name="projectId" type="text" />
      </label>
      <label key={"assigneeId"} className="flex flex-col gap-2">
        <span>Assignee Id</span>
        <input name="assigneeId" type="text" />
      </label>
      <button type="submit">Save Task</button>
    </form>
  );
}

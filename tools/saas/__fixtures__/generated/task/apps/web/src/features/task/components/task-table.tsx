import type { TaskRecord } from "../domain/schemas.js";

export function TaskTable(input: {
  items: readonly TaskRecord[];
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Due At</th>
          <th>Project Id</th>
          <th>Assignee Id</th>
        </tr>
      </thead>
      <tbody>
        {input.items.map((item) => (
          <tr key={item.id}>
            <td>{item.title?.toString()}</td>
            <td>{item.status?.toString()}</td>
            <td>{item.dueAt?.toString()}</td>
            <td>{item.projectId?.toString()}</td>
            <td>{item.assigneeId?.toString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

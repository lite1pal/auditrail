import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskScreen } from "../components/task-screen.js";

describe("TaskScreen", () => {
  it("renders the empty state when no tasks exist", () => {
    render(<TaskScreen items={[]} />);

    expect(screen.getByText("No tasks yet")).toBeTruthy();
  });
});

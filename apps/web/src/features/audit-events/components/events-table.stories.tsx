import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EventsTable } from "./events-table";

const meta = {
  component: EventsTable,
  title: "Features/Audit Events/EventsTable"
} satisfies Meta<typeof EventsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows: [
      {
        actor: "user-1",
        createdAt: "Jan 1, 2026, 12:00 AM",
        event: "user.created",
        id: "event-1",
        metadata: "{\"source\":\"storybook\"}",
        target: "account-1"
      }
    ]
  }
};

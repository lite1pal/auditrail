import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricCard } from "./metric-card";

const meta = {
  component: MetricCard,
  title: "UI/MetricCard"
} satisfies Meta<typeof MetricCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithValue: Story = {
  args: {
    label: "Total events",
    value: "1,240"
  }
};

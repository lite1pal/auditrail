import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "./card";

const meta = {
  component: Card,
  title: "UI/Card"
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Panel content"
  }
};

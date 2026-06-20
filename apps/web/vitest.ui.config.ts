import { mergeConfig } from "vitest/config";

import baseConfig from "./vitest.config";

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      include: [
        "src/components/layout/app-shell.tsx",
        "src/features/audit-events/components/event-detail-panel.tsx",
        "src/features/audit-events/components/event-inspection-workspace.tsx",
        "src/features/organizations/components/invitation-link-card.tsx",
        "src/features/organizations/components/organization-members-screen.tsx",
        "src/features/organizations/components/settings-group.tsx",
        "src/features/organizations/components/settings-sections-nav.tsx",
        "src/features/organizations/components/workspace-settings-hero.tsx",
        "src/features/organizations/components/workspace-settings-screen.tsx",
        "src/features/organizations/components/workspace-settings-sections.tsx",
        "src/features/organizations/components/workspace-sidebar-switcher.tsx"
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    }
  }
});

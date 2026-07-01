import type { Metadata } from "next";

import {
  auditTrailProductModule,
  isAuditTrailOnboardingStepId
} from "@auditrail/domain/audit-events";
import { createProductManifestRegistry } from "@auditrail/domain/product";

import type {
  OnboardingScreenCopy,
  OnboardingStepView
} from "@/src/features/onboarding/domain/onboarding-screen";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import type { WorkspaceSettingsProductCopy } from "@/src/features/organizations/components/workspace-settings-screen.types";

interface WebProductModule {
  buildOnboardingStepViews(input: {
    activeOnboarding: CurrentUserResponse["memberships"][number]["onboarding"];
    activeOrganizationId: string;
    activeProjectId?: string;
  }): OnboardingStepView[];
  getChrome(): {
    errorHeading: string;
    loadingLabel: string;
    metadataDescription: string;
    metadataTitle: string;
  };
  getOnboardingScreenCopy(): OnboardingScreenCopy;
  getRuntimeRegistrations(surface: "api" | "web" | "worker"): ReadonlyArray<{
    id: string;
    surface: "api" | "web" | "worker";
    target: string;
  }>;
  getShellProductConfig(input: {
    activeOrganizationId?: string;
    activeProjectId?: string;
  }): {
    navItems: readonly {
      href: string;
      id: string;
      label: string;
    }[];
    productName: string;
  };
  getWorkspaceSettingsCopy(): WorkspaceSettingsProductCopy;
  manifest: {
    id: string;
    name: string;
  };
}

export interface ShellProductEntry {
  href: string;
  id: string;
  isActive: boolean;
  label: string;
}

export interface ShellProductConfig {
  activeProductId: string;
  availableProducts: readonly ShellProductEntry[];
  navItems: readonly {
    href: string;
    id: string;
    label: string;
  }[];
  productName: string;
}

const registeredProductModules = [auditTrailProductModule] as const satisfies readonly WebProductModule[];

export function createWebProductRuntime(
  productModules: readonly WebProductModule[] = registeredProductModules
) {
  const productRegistry = createProductManifestRegistry(
    productModules.map((productModule) => productModule.manifest)
  );
  const productModulesById = new Map(
    productModules.map((productModule) => [productModule.manifest.id, productModule] as const)
  );
  const defaultProductManifest = productRegistry.list()[0];

  if (!defaultProductManifest) {
    throw new Error("missing_registered_product_modules");
  }

  function requireProductModule(productId: string) {
    const productModule = productModulesById.get(productId);

    if (!productModule) {
      throw new Error(`unknown_product_module:${productId}`);
    }

    return productModule;
  }

  function resolveActiveProductId(input: {
    installedProducts?: ReadonlyArray<{ enabled: boolean; productId: string }>;
    preferredProductId?: string;
  }) {
    const enabledProducts = input.installedProducts
      ? productRegistry.resolveEnabledProducts(input.installedProducts)
      : productRegistry.list();

    if (input.preferredProductId) {
      const preferredProduct = enabledProducts.find(
        (manifest) => manifest.id === input.preferredProductId
      );

      if (preferredProduct) {
        return preferredProduct.id;
      }
    }

    return enabledProducts[0]?.id ?? defaultProductManifest.id;
  }

  return {
    currentProductId: defaultProductManifest.id,
    getProductErrorHeading(productId = defaultProductManifest.id) {
      return requireProductModule(productId).getChrome().errorHeading;
    },
    getProductLoadingLabel(productId = defaultProductManifest.id) {
      return requireProductModule(productId).getChrome().loadingLabel;
    },
    getProductMetadata(productId = defaultProductManifest.id): Metadata {
      const chrome = requireProductModule(productId).getChrome();

      return {
        description: chrome.metadataDescription,
        title: chrome.metadataTitle
      };
    },
    getOnboardingScreenCopy(productId = defaultProductManifest.id) {
      return requireProductModule(productId).getOnboardingScreenCopy();
    },
    getShellProductConfig(input: {
      activeOrganizationId?: string;
      activeProjectId?: string;
      installedProducts?: ReadonlyArray<{ enabled: boolean; productId: string }>;
      preferredProductId?: string;
    }): ShellProductConfig {
      const activeProductId = resolveActiveProductId({
        installedProducts: input.installedProducts,
        preferredProductId: input.preferredProductId
      });
      const activeProductModule = requireProductModule(activeProductId);
      const activeShellConfig = activeProductModule.getShellProductConfig(input);
      const enabledProducts = input.installedProducts
        ? productRegistry.resolveEnabledProducts(input.installedProducts)
        : productRegistry.list();

      return {
        activeProductId,
        availableProducts: enabledProducts.map((manifest) => {
          const productShellConfig = requireProductModule(manifest.id).getShellProductConfig(
            input
          );

          return {
            href: productShellConfig.navItems[0]?.href ?? "/",
            id: manifest.id,
            isActive: manifest.id === activeProductId,
            label: manifest.name
          };
        }),
        navItems: activeShellConfig.navItems,
        productName: activeShellConfig.productName
      };
    },
    getWorkspaceSettingsProductCopy(productId = defaultProductManifest.id) {
      return requireProductModule(productId).getWorkspaceSettingsCopy();
    },
    hasCurrentProductInstalled(
      installedProducts: ReadonlyArray<{ enabled: boolean; productId: string }>
    ) {
      return productRegistry.hasEnabledProduct(installedProducts, defaultProductManifest.id);
    },
    requireProductModule
  };
}

const webProductRuntime = createWebProductRuntime();

export const currentProductId = webProductRuntime.currentProductId;

export function getProductMetadata() {
  return webProductRuntime.getProductMetadata();
}

export function getProductLoadingLabel() {
  return webProductRuntime.getProductLoadingLabel();
}

export function getProductErrorHeading() {
  return webProductRuntime.getProductErrorHeading();
}

export function getShellProductConfig(input: {
  activeOrganizationId?: string;
  activeProjectId?: string;
  installedProducts?: ReadonlyArray<{ enabled: boolean; productId: string }>;
  preferredProductId?: string;
}) {
  return webProductRuntime.getShellProductConfig(input);
}

export function getOnboardingScreenCopy() {
  return webProductRuntime.getOnboardingScreenCopy();
}

export function buildOnboardingStepViews(input: {
  activeOnboarding: CurrentUserResponse["memberships"][number]["onboarding"];
  activeOrganizationId: string;
  activeProjectId?: string;
}): OnboardingStepView[] {
  return auditTrailProductModule.buildOnboardingStepViews({
    ...input,
    activeOnboarding: {
      steps: input.activeOnboarding.steps.map((step) => {
        if (!isAuditTrailOnboardingStepId(step.id)) {
          throw new Error(`unsupported_audit_onboarding_step:${step.id}`);
        }

        return step;
      })
    }
  });
}

export function getWorkspaceSettingsProductCopy() {
  return webProductRuntime.getWorkspaceSettingsProductCopy();
}

export function hasCurrentProductInstalled(
  installedProducts: ReadonlyArray<{ enabled: boolean; productId: string }>
) {
  return webProductRuntime.hasCurrentProductInstalled(installedProducts);
}

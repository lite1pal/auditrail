import { z } from "zod";

const nonEmptyStringSchema = z.string().trim().min(1);

export const frameworkModuleKinds = [
  "platform-core",
  "platform-extension",
  "product",
  "integration",
  "generated-resource",
  "generated-job",
  "generated-ui",
  "tooling"
] as const;

export type FrameworkModuleKind = (typeof frameworkModuleKinds)[number];

export const frameworkOwnershipModes = [
  "organization",
  "user",
  "global",
  "none"
] as const;

export type FrameworkOwnershipMode = (typeof frameworkOwnershipModes)[number];

export const frameworkFieldTypes = [
  "string",
  "text",
  "email",
  "url",
  "number",
  "integer",
  "boolean",
  "date",
  "datetime",
  "enum",
  "json",
  "uuid"
] as const;

export type FrameworkFieldType = (typeof frameworkFieldTypes)[number];

export const frameworkCrudFlags = [
  "list",
  "create",
  "read",
  "update",
  "delete"
] as const;

export type FrameworkCrudFlag = (typeof frameworkCrudFlags)[number];

export const frameworkGeneratedFileActions = [
  "create",
  "update",
  "delete"
] as const;

export type FrameworkGeneratedFileAction =
  (typeof frameworkGeneratedFileActions)[number];

export const frameworkRouteMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE"
] as const;

export type FrameworkRouteMethod = (typeof frameworkRouteMethods)[number];

export const frameworkRouteAuthStrategies = [
  "public",
  "session",
  "api-key",
  "internal"
] as const;

export type FrameworkRouteAuthStrategy =
  (typeof frameworkRouteAuthStrategies)[number];

export type FrameworkJsonValue =
  | boolean
  | null
  | number
  | string
  | FrameworkJsonObject
  | FrameworkJsonValue[];

export interface FrameworkJsonObject {
  [key: string]: FrameworkJsonValue;
}

export interface FrameworkOwnershipDefinition {
  mode: FrameworkOwnershipMode;
  ownerField?: string;
}

export interface FrameworkFieldDefinition {
  defaultValue?: FrameworkJsonValue;
  description?: string;
  enumValues?: readonly string[];
  list?: boolean;
  name: string;
  nullable?: boolean;
  required: boolean;
  type: FrameworkFieldType;
  unique?: boolean;
}

export interface FrameworkCrudDefinition {
  enabledOperations: readonly FrameworkCrudFlag[];
  routeBasePath?: string;
  uiBasePath?: string;
}

export interface FrameworkRouteDefinition {
  authStrategy?: FrameworkRouteAuthStrategy;
  id: string;
  method: FrameworkRouteMethod;
  path: string;
  resourceId?: string;
}

export interface FrameworkCheckDefinition {
  appliesToPaths: readonly string[];
  command: string;
  id: string;
  required: boolean;
}

export interface FrameworkModuleDefinition {
  description?: string;
  id: string;
  kind: FrameworkModuleKind;
  resourceIds: readonly string[];
  rootPath: string;
}

export interface FrameworkResourceDefinition {
  crud?: FrameworkCrudDefinition;
  description?: string;
  fields: readonly FrameworkFieldDefinition[];
  id: string;
  moduleId: string;
  moduleKind: FrameworkModuleKind;
  name: string;
  ownership: FrameworkOwnershipDefinition;
  routes?: readonly FrameworkRouteDefinition[];
}

export interface FrameworkGeneratedFilePlan {
  action: FrameworkGeneratedFileAction;
  moduleKind: FrameworkModuleKind;
  path: string;
  reason: string;
  requiresManualReview: boolean;
  templateId?: string;
}

export interface FrameworkAgentTaskDefinition {
  allowedPaths: readonly string[];
  contextFiles: readonly string[];
  forbiddenPaths: readonly string[];
  goal: string;
  id: string;
  reportFields: readonly string[];
  requiredChecks: readonly string[];
  stopConditions: readonly string[];
  taskType: string;
}

export interface FrameworkAgentContextDefinition {
  checkIds: readonly string[];
  contextFiles: readonly string[];
  moduleIds: readonly string[];
  resourceIds: readonly string[];
  summary: string;
  taskIds: readonly string[];
}

export interface FrameworkGeneratorPlan {
  agentContext: FrameworkAgentContextDefinition;
  agentTasks: readonly FrameworkAgentTaskDefinition[];
  checks: readonly FrameworkCheckDefinition[];
  generatedFiles: readonly FrameworkGeneratedFilePlan[];
  modules: readonly FrameworkModuleDefinition[];
  resources: readonly FrameworkResourceDefinition[];
}

export const frameworkModuleKindSchema = z.enum(frameworkModuleKinds);

export const frameworkOwnershipModeSchema = z.enum(frameworkOwnershipModes);

export const frameworkFieldTypeSchema = z.enum(frameworkFieldTypes);

export const frameworkCrudFlagSchema = z.enum(frameworkCrudFlags);

export const frameworkGeneratedFileActionSchema = z.enum(
  frameworkGeneratedFileActions
);

export const frameworkRouteMethodSchema = z.enum(frameworkRouteMethods);

export const frameworkRouteAuthStrategySchema = z.enum(
  frameworkRouteAuthStrategies
);

export const frameworkJsonValueSchema: z.ZodType<FrameworkJsonValue> = z.lazy(
  () =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(frameworkJsonValueSchema),
      z.record(z.string(), frameworkJsonValueSchema)
    ])
);

export const frameworkOwnershipDefinitionSchema = z
  .object({
    mode: frameworkOwnershipModeSchema,
    ownerField: nonEmptyStringSchema.optional()
  })
  .superRefine((value, context) => {
    const requiresOwnerField =
      value.mode === "organization" || value.mode === "user";

    if (requiresOwnerField && !value.ownerField) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "organization and user ownership must declare an ownerField",
        path: ["ownerField"]
      });
    }

    if (!requiresOwnerField && value.ownerField) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "global and none ownership must not declare an ownerField",
        path: ["ownerField"]
      });
    }
  }) satisfies z.ZodType<FrameworkOwnershipDefinition>;

export const frameworkFieldDefinitionSchema = z
  .object({
    defaultValue: frameworkJsonValueSchema.optional(),
    description: nonEmptyStringSchema.optional(),
    enumValues: z.array(nonEmptyStringSchema).min(1).optional(),
    list: z.boolean().optional(),
    name: nonEmptyStringSchema,
    nullable: z.boolean().optional(),
    required: z.boolean(),
    type: frameworkFieldTypeSchema,
    unique: z.boolean().optional()
  })
  .superRefine((value, context) => {
    if (value.type === "enum" && !value.enumValues) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "enum fields must declare enumValues",
        path: ["enumValues"]
      });
    }

    if (value.type !== "enum" && value.enumValues) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "enumValues are allowed only for enum fields",
        path: ["enumValues"]
      });
    }
  }) satisfies z.ZodType<FrameworkFieldDefinition>;

export const frameworkCrudDefinitionSchema = z.object({
  enabledOperations: z.array(frameworkCrudFlagSchema).min(1),
  routeBasePath: nonEmptyStringSchema.optional(),
  uiBasePath: nonEmptyStringSchema.optional()
}) satisfies z.ZodType<FrameworkCrudDefinition>;

export const frameworkRouteDefinitionSchema = z.object({
  authStrategy: frameworkRouteAuthStrategySchema.optional(),
  id: nonEmptyStringSchema,
  method: frameworkRouteMethodSchema,
  path: nonEmptyStringSchema,
  resourceId: nonEmptyStringSchema.optional()
}) satisfies z.ZodType<FrameworkRouteDefinition>;

export const frameworkCheckDefinitionSchema = z.object({
  appliesToPaths: z.array(nonEmptyStringSchema),
  command: nonEmptyStringSchema,
  id: nonEmptyStringSchema,
  required: z.boolean()
}) satisfies z.ZodType<FrameworkCheckDefinition>;

export const frameworkModuleDefinitionSchema = z.object({
  description: nonEmptyStringSchema.optional(),
  id: nonEmptyStringSchema,
  kind: frameworkModuleKindSchema,
  resourceIds: z.array(nonEmptyStringSchema),
  rootPath: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkModuleDefinition>;

export const frameworkResourceDefinitionSchema = z.object({
  crud: frameworkCrudDefinitionSchema.optional(),
  description: nonEmptyStringSchema.optional(),
  fields: z.array(frameworkFieldDefinitionSchema).min(1),
  id: nonEmptyStringSchema,
  moduleId: nonEmptyStringSchema,
  moduleKind: frameworkModuleKindSchema,
  name: nonEmptyStringSchema,
  ownership: frameworkOwnershipDefinitionSchema,
  routes: z.array(frameworkRouteDefinitionSchema).optional()
}) satisfies z.ZodType<FrameworkResourceDefinition>;

export const frameworkGeneratedFilePlanSchema = z.object({
  action: frameworkGeneratedFileActionSchema,
  moduleKind: frameworkModuleKindSchema,
  path: nonEmptyStringSchema,
  reason: nonEmptyStringSchema,
  requiresManualReview: z.boolean(),
  templateId: nonEmptyStringSchema.optional()
}) satisfies z.ZodType<FrameworkGeneratedFilePlan>;

export const frameworkAgentTaskDefinitionSchema = z.object({
  allowedPaths: z.array(nonEmptyStringSchema),
  contextFiles: z.array(nonEmptyStringSchema),
  forbiddenPaths: z.array(nonEmptyStringSchema),
  goal: nonEmptyStringSchema,
  id: nonEmptyStringSchema,
  reportFields: z.array(nonEmptyStringSchema),
  requiredChecks: z.array(nonEmptyStringSchema),
  stopConditions: z.array(nonEmptyStringSchema),
  taskType: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkAgentTaskDefinition>;

export const frameworkAgentContextDefinitionSchema = z.object({
  checkIds: z.array(nonEmptyStringSchema),
  contextFiles: z.array(nonEmptyStringSchema),
  moduleIds: z.array(nonEmptyStringSchema),
  resourceIds: z.array(nonEmptyStringSchema),
  summary: nonEmptyStringSchema,
  taskIds: z.array(nonEmptyStringSchema)
}) satisfies z.ZodType<FrameworkAgentContextDefinition>;

export const frameworkGeneratorPlanSchema = z.object({
  agentContext: frameworkAgentContextDefinitionSchema,
  agentTasks: z.array(frameworkAgentTaskDefinitionSchema),
  checks: z.array(frameworkCheckDefinitionSchema),
  generatedFiles: z.array(frameworkGeneratedFilePlanSchema),
  modules: z.array(frameworkModuleDefinitionSchema),
  resources: z.array(frameworkResourceDefinitionSchema)
}) satisfies z.ZodType<FrameworkGeneratorPlan>;

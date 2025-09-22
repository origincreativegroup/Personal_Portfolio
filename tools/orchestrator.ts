/**
 * Orchestrator: routes tasks to role-agents with hard constraints.
 * - Only allows edits inside allowed paths for the given label set.
 * - Enforces 'plan -> diff -> apply' loop.
 * - Rejects tasks missing SSOT references.
 */
export type Role = "planner" | "architect" | "web" | "api" | "qa";

const ALLOW: Record<Role, RegExp[]> = {
  planner: [/^docs\//, /^\.github\//],
  architect: [/^docs\//, /^shared\//, /^backend\//],
  web: [/^frontend\//, /^src\//, /^docs\/telemetry\.md$/],
  api: [/^backend\//, /^shared\//, /^docs\/openapi\.yaml$/, /^docs\/schema\//],
  qa: [/^frontend\//, /^backend\//, /^tests\//, /^docs\/telemetry\.md$/]
};

export function canEdit(role: Role, file: string) {
  return (ALLOW[role] || []).some(rx => rx.test(file));
}

export function requiresSSOTRef(taskBody: string) {
  return !/docs\/(system|product_spec|architecture)\.md#L\d+/.test(taskBody) ? true : false;
}

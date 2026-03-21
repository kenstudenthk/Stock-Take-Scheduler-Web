export interface GroupConfig {
  label: string;
  color: string;
  borderColor: string;
}

export const GROUP_CONFIG: Record<number, GroupConfig> = {
  1: { label: "A", color: "#0369a1", borderColor: "#0369a1" },
  2: { label: "B", color: "#7e22ce", borderColor: "#7e22ce" },
  3: { label: "C", color: "#c2410c", borderColor: "#c2410c" },
};

export const GROUP_DEFAULT_COLOR = "#94a3b8";

export function getGroupLabel(groupId: number): string {
  return GROUP_CONFIG[groupId]?.label ?? String.fromCharCode(64 + groupId);
}

export function getGroupColor(groupId: number): string {
  return GROUP_CONFIG[groupId]?.color ?? GROUP_DEFAULT_COLOR;
}

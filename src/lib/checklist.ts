export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
};

export function parseChecklist(json: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => ({
        id: String(item.id ?? `item-${index + 1}`),
        label: String(item.label ?? "").trim(),
        required: Boolean(item.required),
        done: Boolean(item.done),
      }))
      .filter((item) => item.label);
  } catch {
    return [];
  }
}

export function pendingRequired(items: ChecklistItem[]) {
  return items.filter((item) => item.required && !item.done);
}

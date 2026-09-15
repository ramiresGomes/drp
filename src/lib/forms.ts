import { redirect } from "next/navigation";

export function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function optionalDate(formData: FormData, key: string) {
  const value = field(formData, key);
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fail(path: string, message: string): never {
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

export function ok(path: string): never {
  redirect(path.includes("?") ? `${path}&ok=1` : `${path}?ok=1`);
}

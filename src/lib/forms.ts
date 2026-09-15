import { redirect } from "next/navigation";

export function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function fail(path: string, message: string): never {
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

export function ok(path: string): never {
  redirect(path.includes("?") ? `${path}&ok=1` : `${path}?ok=1`);
}

import { ProductShell } from "@/components/product-shell";
import { ensureOccurrences } from "@/lib/occurrences";
import { deliverScheduledNotifications } from "@/lib/notifications";
import { requirePerson } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePerson();
  await Promise.all([ensureOccurrences(), deliverScheduledNotifications()]);
  return <ProductShell person={person}>{children}</ProductShell>;
}

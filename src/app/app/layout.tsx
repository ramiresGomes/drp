import { ProductShell } from "@/components/product-shell";
import { ensureOccurrences } from "@/lib/occurrences";
import { requirePerson } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePerson();
  await ensureOccurrences();
  return <ProductShell person={person}>{children}</ProductShell>;
}

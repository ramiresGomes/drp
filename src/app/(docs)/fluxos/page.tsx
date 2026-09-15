import type { Metadata } from "next";
import { FlowList } from "@/components/flow-list";
import { PageHeader } from "@/components/page-header";
import { complementary, flows } from "@/content/flows";

export const metadata: Metadata = { title: "Fluxos" };

export default function FlowsPage() {
  return (
    <div>
      <PageHeader
        kicker="Operação"
        title="Do credenciamento ao indicador, sem pular o fato."
        description="A escala é uma intenção. A presença é o que aconteceu. Cancelamento, extra e justificativa não desaparecem."
      />

      <FlowList flows={flows} />

      <section className="mt-12">
        <h2 className="mb-4 text-2xl">Complementos aceitos</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {complementary.map((item) => (
            <li key={item} className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

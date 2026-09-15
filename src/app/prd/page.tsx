import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { acceptance, prd } from "@/content/prd";

export const metadata: Metadata = { title: "PRD" };

export default function PrdPage() {
  return (
    <div>
      <PageHeader
        kicker={`PRD ${prd.version}`}
        badge={prd.product}
        title="Primeira versão: a secretaria opera a regional inteira; o colaborador só vê o que lhe cabe."
        description={prd.goal}
      />

      <section className="mb-10">
        <h2 className="mb-3 text-2xl">Fora da v1</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {prd.outOfScopeV1.map((item) => (
            <li key={item} className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-2xl">Módulos</h2>
        <Accordion multiple defaultValue={prd.modules.map((module) => module.id)}>
          {prd.modules.map((module) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="text-left text-lg">{module.title}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3">
                  {module.stories.map((story) => (
                    <li key={story} className="text-sm leading-6 text-muted-foreground">
                      {story}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section>
        <h2 className="mb-3 text-2xl">Critérios de aceite</h2>
        <div className="flex flex-col gap-2">
          {acceptance.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Badge variant="secondary">Aceite</Badge>
              <p className="text-sm leading-6">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

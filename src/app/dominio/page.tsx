import type { Metadata } from "next";
import { EntityGrid } from "@/components/entity-grid";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { entities, participationStates, personStatuses, relationships } from "@/content/domain";

export const metadata: Metadata = { title: "Domínio" };

export default function DomainPage() {
  return (
    <div>
      <PageHeader
        kicker="Dados"
        title="O modelo guarda história. Nada crítico é sobrescrito."
        description="Funções, vínculos e presenças têm início, término e autoria. Relatórios posteriores dependem disso."
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Entidades centrais</h2>
        <EntityGrid items={entities} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Status da pessoa</h2>
        <div className="flex flex-wrap gap-2">
          {personStatuses.map((status) => (
            <Badge key={status} variant="secondary">
              {status}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Estados de participação</h2>
        <div className="grid gap-3">
          {participationStates.map((item) => (
            <Card key={item.state} className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.state}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.meaning}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Relacionamentos</h2>
        <ul className="space-y-3">
          {relationships.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

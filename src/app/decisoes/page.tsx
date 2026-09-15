import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closedDecisions, dualApprovalProposal, stillOpen } from "@/content/decisions";

export const metadata: Metadata = { title: "Decisões" };

export default function DecisionsPage() {
  return (
    <div>
      <PageHeader
        kicker="Governança"
        title="O modelo já pode virar implementação. Restam poucas decisões curtas."
        description="A dupla aprovação ficou em aberto. A proposta abaixo separa o que muda o indicador oficial do que é rotina da instituição."
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Já fechado</h2>
        <ul className="space-y-3">
          {closedDecisions.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6">
              <Badge variant="secondary">Fechado</Badge>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Dupla aprovação — proposta</h2>
        <div className="grid gap-3">
          {dualApprovalProposal.map((item) => (
            <Card key={item.action} className="shadow-none">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <CardTitle className="text-lg">{item.action}</CardTitle>
                <Badge variant={item.recommend === "Não" ? "outline" : "secondary"}>
                  {item.recommend}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.why}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Ainda aberto</h2>
        <div className="grid gap-4">
          {stillOpen.map((item) => (
            <Card key={item.id} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.proposal}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

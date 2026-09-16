import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closedDecisions, dualApprovalRules } from "@/content/decisions";

export const metadata: Metadata = { title: "Decisões" };

export default function DecisionsPage() {
  return (
    <div>
      <PageHeader
        kicker="Governança"
        badge="PRD 1.0"
        title="A definição de negócio está fechada."
        description="Login, menores, cidades e dupla aprovação já foram confirmados. A operação cotidiana da v1 já está no sistema."
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Dupla aprovação</h2>
        <div className="grid gap-3">
          {dualApprovalRules.map((item) => (
            <Card key={item.action} className="shadow-none">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <CardTitle className="text-lg">{item.action}</CardTitle>
                <Badge variant={item.required ? "secondary" : "outline"}>
                  {item.required ? "Exige duas aprovações" : "Um responsável + auditoria"}
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
        <h2 className="mb-4 text-2xl">Demais decisões fechadas</h2>
        <ul className="space-y-3">
          {closedDecisions.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6">
              <Badge variant="secondary">Fechado</Badge>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

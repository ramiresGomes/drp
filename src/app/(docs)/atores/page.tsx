import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clients,
  competencies,
  organizationalRoles,
  permissionPrinciples,
} from "@/content/actors";

export const metadata: Metadata = { title: "Atores e painéis" };

export default function ActorsPage() {
  return (
    <div>
      <PageHeader
        kicker="Clientes do sistema"
        title="Três painéis, os mesmos dados, permissões diferentes."
        description="Administrativo na web com segurança maior. Coordenação de instituição pronta para virar PWA. Colaborador com o caminho mais simples possível, sem abrir mão do login."
      />

      <section className="mb-10 grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="shadow-none">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{client.name}</CardTitle>
                <Badge variant="secondary">{client.surface}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{client.users}</p>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 md:grid-cols-2">
                {client.capabilities.map((item) => (
                  <li key={item} className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Funções organizacionais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {organizationalRoles.map((role) => (
            <Card key={role.name} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">{role.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{role.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Competências</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {competencies.map((item) => (
            <Card key={item.name} className="shadow-none">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.rule}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Princípios de permissão</h2>
        <ul className="space-y-3">
          {permissionPrinciples.map((item) => (
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

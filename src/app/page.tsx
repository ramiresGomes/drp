import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closedScope, nextSteps, recoveryNotes } from "@/content/overview";

export default function HomePage() {
  return (
    <div>
      <PageHeader
        kicker="Projeto DRP"
        badge="Definição fechada"
        title="O Darpe de Uberlândia volta a ter um documento vivo."
        description={recoveryNotes.summary}
      />

      <div className="mb-10 flex flex-wrap gap-3">
        <Button render={<Link href="/prd" />}>Ler o PRD</Button>
        <Button render={<Link href="/decisoes" />} variant="outline">
          Decisões fechadas
        </Button>
      </div>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Organização</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">{closedScope.organization}</p>
            <p className="mt-2 text-sm text-muted-foreground">{closedScope.church}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Escopo da v1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">Regional {closedScope.regional}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cidades cadastradas no painel. Sem multi-regional.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Setores</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1 text-sm text-muted-foreground">
              {closedScope.sectors.map((sector) => (
                <li key={sector.code}>
                  {sector.code}. {sector.name}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">O que foi resgatado da sessão</h2>
        <ul className="space-y-3">
          {recoveryNotes.recovered.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Como continuar</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {nextSteps.map((step, index) => (
            <Card key={step.title} className="shadow-none">
              <CardHeader>
                <p className="text-xs tracking-[0.16em] text-primary uppercase">
                  Passo {index + 1}
                </p>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

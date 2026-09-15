import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardWidgets, reportBuilder } from "@/content/metrics";

export const metadata: Metadata = { title: "Métricas" };

export default function MetricsPage() {
  return (
    <div>
      <PageHeader
        kicker="Indicadores"
        title="O painel inicial mostra pendências. O construtor cruza fatos, não colunas soltas."
        description={reportBuilder.principle}
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Painel sugerido</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {dashboardWidgets.map((widget) => (
            <Card key={widget.title} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{widget.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Fatos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {reportBuilder.facts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Dimensões</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {reportBuilder.dimensions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Regras de cálculo</h2>
        <ul className="space-y-3">
          {reportBuilder.rules.map((item) => (
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

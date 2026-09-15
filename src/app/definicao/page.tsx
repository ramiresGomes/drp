import type { Metadata } from "next";
import { EntityGrid } from "@/components/entity-grid";
import { PageHeader } from "@/components/page-header";
import { closedScope } from "@/content/overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Definição" };

export default function DefinitionPage() {
  return (
    <div>
      <PageHeader
        kicker="Modelo conceitual"
        title="Uma regional credencia pessoas, vincula instituições e registra o que de fato aconteceu."
        description="O Darpe de Uberlândia não é um cadastro genérico de igreja. Ele organiza quem pode ir a cada instituição, gera as ocorrências recorrentes, monta escalas e transforma presença em indicador."
      />

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Separação que evita ambiguidade</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Função organizacional", "Autoridade no Darpe: secretário, ancião, encarregado, jurídico, colaborador."],
            ["Competência", "O que a pessoa executa: músico, cantor, atendente, porteiro. Músico e cantor não se misturam."],
            ["Permissão", "O que o sistema deixa fazer. Cargo sugere, mas não libera sozinho."],
            ["Responsabilidade contextual", "Por qual instituição ou evento a pessoa responde naquele período."],
          ].map(([title, text]) => (
            <Card key={title} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl">Território da v1</h2>
        <p className="mb-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          Uberlândia é a cidade-sede da regional. As demais cidades são cadastradas e pertencem a ela.
          Instituição não sobe nem desce hierarquia de setor: setor classifica, cidade localiza.
          A comum congregação diz onde a pessoa costuma congregar, sem criar ministérios paralelos.
        </p>
        <div className="flex flex-wrap gap-2">
          {closedScope.citiesSeed.map((city) => (
            <span
              key={city}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm"
            >
              {city}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground">
            demais cidades cadastráveis
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Cadeia operacional</h2>
        <EntityGrid
          items={[
            {
              name: "Credenciamento",
              note: "A pessoa entra uma vez no Darpe, com login, funções e competências.",
            },
            {
              name: "Vínculo",
              note: "Uma autoridade já contactada autoriza a pessoa em instituições específicas.",
            },
            {
              name: "Série e ocorrência",
              note: "A instituição tem datas fixas. O sistema gera o atendimento concreto com 10 dias de folga.",
            },
            {
              name: "Escala e presença",
              note: "A previsão não é o fato. Extra, falta, justificativa e cancelamento alimentam o histórico.",
            },
          ]}
        />
      </section>
    </div>
  );
}

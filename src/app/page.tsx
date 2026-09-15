import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closedScope } from "@/content/overview";

export default function HomePage() {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-primary uppercase">CCB · Regional Uberlândia</p>
            <p className="font-heading text-2xl">DRP</p>
          </div>
          <div className="flex gap-2">
            <Button render={<Link href="/definicao" />} variant="outline">
              Definição
            </Button>
            <Button render={<Link href="/entrar" />}>Entrar</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">Darpe operacional</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight sm:text-6xl">
          Escala, presença e cadastro da Regional Uberlândia, no mesmo sistema.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          O DRP atende o Departamento de Assistência Religiosa para Evangelização desta regional. Secretaria,
          coordenação e colaboradores entram com o e-mail Google cadastrado. Visitante sem credencial completa não
          escala.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/entrar" />} size="lg">
            Abrir o sistema
          </Button>
          <Button render={<Link href="/prd" />} variant="outline" size="lg">
            Ler o PRD
          </Button>
        </div>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Secretaria</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pessoas, instituições, vínculos, séries de atendimento, eventos obrigatórios, avisos internos e dupla
              aprovação.
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Coordenação</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Escala só de vinculados, cancelamento justificado, presença no mesmo dia e participação extra nas
              métricas.
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Agenda, justificativa no prazo, avisos com ciência e confirmação, e os próprios dados do cadastro Darpe.
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl">Setores da regional</h2>
          <ol className="grid gap-2 md:grid-cols-2">
            {closedScope.sectors.map((sector) => (
              <li key={sector.code} className="rounded-xl border border-border px-4 py-3 text-sm">
                <span className="text-primary">{sector.code}.</span> {sector.name}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

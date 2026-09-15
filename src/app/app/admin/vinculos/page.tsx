import { createInstitutionLink, revokeInstitutionLink } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { isLinkActive } from "@/lib/links";
import { requireAdmin } from "@/lib/session";
import { formatDay } from "@/lib/dates";

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [links, people, institutions] = await Promise.all([
    prisma.institutionLink.findMany({
      include: { person: true, institution: { include: { city: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.person.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/vinculos" />
      <h1 className="mb-2 font-heading text-3xl">Vínculos institucionais</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sem vínculo ativo a pessoa não entra na escala. Não há aceite digital nem visitante sem cadastro completo.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Conceder vínculo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInstitutionLink} className="grid gap-3 md:grid-cols-3">
            <Field label="Pessoa">
              <select className={controlClass} name="personId" required>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Instituição">
              <select className={controlClass} name="institutionId" required>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Button type="submit">Conceder</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {links.length === 0 ? (
        <EmptyState title="Nenhum vínculo" description="Conceda o primeiro vínculo para liberar escala." />
      ) : (
        <div className="grid gap-3">
          {links.map((link) => (
            <div key={link.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {link.person.name} · {link.institution.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isLinkActive(link) ? "Ativo" : "Encerrado"}
                  {link.endAt ? ` em ${formatDay(link.endAt)}` : ""}
                  {link.justification ? ` · ${link.justification}` : ""}
                </p>
              </div>
              {isLinkActive(link) ? (
                <form action={revokeInstitutionLink} className="flex gap-2">
                  <input type="hidden" name="id" value={link.id} />
                  <input className={controlClass} name="justification" placeholder="Motivo" required />
                  <Button type="submit" variant="outline">
                    Encerrar
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

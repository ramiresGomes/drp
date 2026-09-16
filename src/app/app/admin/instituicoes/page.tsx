import { createInstitution, setInstitutionActive, setInstitutionResponsible } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function InstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [institutions, cities, sectors, people] = await Promise.all([
    prisma.institution.findMany({
      include: { city: true, sector: true, responsibles: { include: { person: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.sector.findMany({ orderBy: { code: "asc" } }),
    prisma.person.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/instituicoes" />
      <h1 className="mb-2 font-heading text-3xl">Instituições</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Cada instituição pertence a exatamente uma cidade e um setor. Não há hierarquia setor–instituição além disso.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Nova instituição</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInstitution} className="grid gap-3 md:grid-cols-2">
            <Field label="Nome">
              <input className={controlClass} name="name" required />
            </Field>
            <Field label="Endereço">
              <input className={controlClass} name="address" required />
            </Field>
            <Field label="Cidade">
              <select className={controlClass} name="cityId" required>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Setor">
              <select className={controlClass} name="sectorId" required>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.code}. {sector.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Telefone">
              <input className={controlClass} name="phone" />
            </Field>
            <Field label="Capacidade (opcional)">
              <input className={controlClass} name="capacity" type="number" min={1} />
            </Field>
            <Field label="Mapa">
              <input className={controlClass} name="mapsUrl" placeholder="https://" />
            </Field>
            <Field label="Observação">
              <input className={controlClass} name="notes" />
            </Field>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="requiresRecadastramento" /> Exige recadastramento periódico
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Cadastrar instituição</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {institutions.length === 0 ? (
        <EmptyState title="Nenhuma instituição" description="Cadastre o primeiro local de atendimento." />
      ) : (
        <div className="grid gap-3">
          {institutions.map((institution) => (
            <div key={institution.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {institution.name}
                {institution.active ? "" : " · inativa"}
              </p>
              <p className="text-sm text-muted-foreground">
                {institution.city.name} · setor {institution.sector.code} · {institution.address}
                {institution.capacity ? ` · capacidade ${institution.capacity}` : ""}
                {institution.requiresRecadastramento ? " · exige recadastramento" : ""}
              </p>
              <p className="mt-2 text-sm">
                Responsáveis:{" "}
                {institution.responsibles.map((item) => item.person.name).join(", ") || "ainda sem responsável"}
              </p>
              <form action={setInstitutionResponsible} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="institutionId" value={institution.id} />
                <select className={controlClass} name="personId" required>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline">
                  Definir responsável
                </Button>
              </form>
              <form action={setInstitutionActive} className="mt-3">
                <input type="hidden" name="id" value={institution.id} />
                <input type="hidden" name="active" value={institution.active ? "false" : "true"} />
                <Button type="submit" variant={institution.active ? "outline" : "secondary"}>
                  {institution.active ? "Inativar instituição" : "Reativar instituição"}
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

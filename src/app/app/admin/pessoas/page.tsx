import { createPerson } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { CompetencyFields } from "@/components/competency-fields";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { COMPETENCY_LABELS, ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { requireAdmin } from "@/lib/session";
import { formatDay } from "@/lib/dates";
import Link from "next/link";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [people, congregations] = await Promise.all([
    prisma.person.findMany({
      include: { congregation: { include: { city: true } }, roles: true, competencies: true },
      orderBy: { name: "asc" },
    }),
    prisma.congregation.findMany({ include: { city: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/pessoas" />
      <h1 className="mb-2 font-heading text-3xl">Cadastro Darpe</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Uma pessoa, um cadastro. O vínculo institucional é o que autoriza a escala. Menor entra com e-mail Google após
        o consentimento registrado pela secretaria.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Nova pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPerson} className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo">
              <input className={controlClass} name="name" required />
            </Field>
            <Field label="E-mail Google">
              <input className={controlClass} type="email" name="email" required />
            </Field>
            <Field label="Telefone">
              <input className={controlClass} name="phone" required />
            </Field>
            <Field label="Nascimento">
              <input className={controlClass} type="date" name="birthDate" required />
            </Field>
            <Field label="Comum de congregação">
              <select className={controlClass} name="congregationId" required>
                {congregations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.city.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observação">
              <input className={controlClass} name="notes" />
            </Field>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Papéis</legend>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="roles" value={value} defaultChecked={value === "COLABORADOR"} />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3">
              <CompetencyFields />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isMinor" /> Menor de 18 anos, com consentimento da secretaria
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Salvar cadastro</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {people.length === 0 ? (
        <EmptyState title="Nenhuma pessoa" description="Cadastre a primeira pessoa da regional." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Comum</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Competências</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <Link href={`/app/admin/pessoas/${person.id}`} className="font-medium hover:underline">
                    {person.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{person.email}</p>
                </TableCell>
                <TableCell>
                  {person.congregation.name}
                  <span className="block text-xs text-muted-foreground">{person.congregation.city.name}</span>
                </TableCell>
                <TableCell>{person.roles.map((item) => ROLE_LABELS[item.role] ?? item.role).join(", ") || "—"}</TableCell>
                <TableCell>
                  {person.competencies.map((item) => COMPETENCY_LABELS[item.competency] ?? item.competency).join(", ") ||
                    "—"}
                </TableCell>
                <TableCell>
                  {STATUS_LABELS[person.status] ?? person.status}
                  {person.birthDate ? <span className="block text-xs text-muted-foreground">{formatDay(person.birthDate)}</span> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePerson } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { CompetencyFields } from "@/components/competency-fields";
import { Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { requireAdmin } from "@/lib/session";
import { format } from "date-fns";

const EDITABLE_STATUS = ["ACTIVE", "AFASTADA", "SUSPENSA", "DESLIGADA", "FALECIDA"] as const;

export default async function PersonEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flash = await searchParams;
  const [person, congregations] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: { congregation: true, roles: true, competencies: true },
    }),
    prisma.congregation.findMany({ include: { city: true }, orderBy: { name: "asc" } }),
  ]);
  if (!person) notFound();

  return (
    <div>
      <AdminNav current="/app/admin/pessoas" />
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Cadastro Darpe</p>
      <h1 className="mt-2 mb-2 font-heading text-3xl">{person.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Papéis e situação mudam aqui. Exclusão definitiva continua só no fluxo LGPD com dupla aprovação.
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Editar pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePerson} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={person.id} />
            <Field label="Nome completo">
              <input className={controlClass} name="name" defaultValue={person.name} required />
            </Field>
            <Field label="E-mail Google">
              <input className={controlClass} type="email" name="email" defaultValue={person.email} required />
            </Field>
            <Field label="Telefone">
              <input className={controlClass} name="phone" defaultValue={person.phone} required />
            </Field>
            <Field label="Nascimento">
              <input
                className={controlClass}
                type="date"
                name="birthDate"
                defaultValue={person.birthDate ? format(person.birthDate, "yyyy-MM-dd") : ""}
                required
              />
            </Field>
            <Field label="Comum de congregação">
              <select className={controlClass} name="congregationId" defaultValue={person.congregationId} required>
                {congregations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.city.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Situação">
              <select className={controlClass} name="status" defaultValue={person.status} disabled={person.status === "ERASED"}>
                {EDITABLE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Validade do documento">
              <input
                className={controlClass}
                type="date"
                name="documentExpiresAt"
                defaultValue={person.documentExpiresAt ? format(person.documentExpiresAt, "yyyy-MM-dd") : ""}
              />
            </Field>
            <Field label="Observação" className="md:col-span-2">
              <input className={controlClass} name="notes" defaultValue={person.notes ?? ""} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="religiousConsent" defaultChecked={Boolean(person.religiousConsentAt)} />{" "}
              Consentimento para dado religioso
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="photoConsent" defaultChecked={Boolean(person.photoConsentAt)} /> Consentimento
              para fotos
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Papéis</legend>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="roles"
                    value={value}
                    defaultChecked={person.roles.some((item) => item.role === value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3">
              <CompetencyFields defaults={person.competencies.map((item) => item.competency)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isMinor" defaultChecked={person.isMinor} /> Menor de 18 anos, com
                consentimento da secretaria
              </label>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit">Salvar alterações</Button>
              <Button render={<Link href="/app/admin/pessoas" />} variant="outline">
                Voltar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { saveAvailability, updateOwnProfile } from "@/app/actions/member";
import { Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { COMPETENCY_LABELS, ROLE_LABELS, WEEKDAYS } from "@/lib/labels";
import { requirePerson } from "@/lib/session";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const current = await requirePerson();
  const params = await searchParams;
  const person = await prisma.person.findUniqueOrThrow({
    where: { id: current.id },
    include: {
      congregation: { include: { city: true } },
      roles: true,
      competencies: true,
      links: { include: { institution: true } },
      availability: true,
    },
  });

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl">Meus dados</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Papéis, competências e comum de congregação são da secretaria. Telefone, observação e disponibilidade você
        atualiza aqui.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Cadastro Darpe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{person.name}</p>
            <p>{person.email}</p>
            <p>
              {person.congregation.name} · {person.congregation.city.name}
            </p>
            <p>{person.roles.map((item) => ROLE_LABELS[item.role] ?? item.role).join(", ") || "Sem papel"}</p>
            <p>
              {person.competencies.map((item) => COMPETENCY_LABELS[item.competency] ?? item.competency).join(", ") ||
                "Sem competência"}
            </p>
            <p>
              Vínculos:{" "}
              {person.links.map((link) => link.institution.name).join(", ") || "nenhum vínculo institucional"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateOwnProfile} className="grid gap-3">
              <Field label="Telefone">
                <input className={controlClass} name="phone" defaultValue={person.phone} required />
              </Field>
              <Field label="Observação">
                <textarea className={areaClass} name="notes" defaultValue={person.notes ?? ""} />
              </Field>
              <Button type="submit">Salvar</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Disponibilidade semanal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {WEEKDAYS.map((day) => {
            const currentDay = person.availability.find((item) => item.weekday === Number(day.value));
            return (
              <form action={saveAvailability} key={day.value} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[8rem_auto_6rem] sm:items-end">
                <input type="hidden" name="weekday" value={day.value} />
                <p className="text-sm font-medium">{day.label}</p>
                <Field label="Nota">
                  <input className={controlClass} name="note" defaultValue={currentDay?.note ?? ""} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="available" defaultChecked={currentDay?.available ?? true} />
                  Disponível
                </label>
                <Button type="submit" variant="outline" className="sm:col-span-3">
                  Atualizar {day.label.toLowerCase()}
                </Button>
              </form>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

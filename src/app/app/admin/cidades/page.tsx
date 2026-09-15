import { createCongregation, createCity } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const cities = await prisma.city.findMany({
    include: { congregations: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <AdminNav current="/app/admin/cidades" />
      <h1 className="mb-2 font-heading text-3xl">Cidades e comuns</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        A regional cadastra as cidades no painel. Uberlândia é a sede; cada pessoa tem uma comum de congregação.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Nova cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCity} className="grid gap-3">
              <Field label="Nome">
                <input className={controlClass} name="name" required />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isSeat" /> Sede da regional
              </label>
              <Button type="submit">Cadastrar cidade</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Nova comum</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCongregation} className="grid gap-3">
              <Field label="Nome da comum">
                <input className={controlClass} name="name" required />
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
              <Button type="submit">Cadastrar comum</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {cities.length === 0 ? (
        <EmptyState title="Nenhuma cidade" description="Cadastre a primeira cidade da regional." />
      ) : (
        <div className="grid gap-3">
          {cities.map((city) => (
            <div key={city.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">
                {city.name} {city.isSeat ? <span className="text-xs text-primary">· sede</span> : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {city.congregations.length === 0
                  ? "Ainda sem comum cadastrada."
                  : city.congregations.map((item) => item.name).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

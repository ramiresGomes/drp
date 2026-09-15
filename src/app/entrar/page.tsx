import Link from "next/link";
import { demoSignIn, googleSignIn } from "@/app/actions/auth";
import { Flash } from "@/components/flash";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { controlClass, Field } from "@/components/field";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const DEMO = [
  { email: "secretaria@darpe.local", name: "Ramires Gomes", role: "Secretaria / superadmin" },
  { email: "anciao@darpe.local", name: "João Batista", role: "Ancião coordenador" },
  { email: "coordenacao@darpe.local", name: "Pedro Henrique", role: "Responsável do HC" },
  { email: "colaboradora@darpe.local", name: "Ana Clara", role: "Colaboradora / cantora" },
  { email: "encarregada@darpe.local", name: "Maria das Dores", role: "Encarregada regional" },
  { email: "juridico@darpe.local", name: "Helena Souza", role: "Jurídico" },
  { email: "menor@darpe.local", name: "Lucas Silva", role: "Colaborador menor" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.email) redirect("/app");
  const params = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const erro =
    params.erro ||
    (params.error === "nao-cadastrado"
      ? "Este e-mail Google ainda não tem cadastro Darpe."
      : params.error
        ? "Não foi possível entrar. Confira o e-mail cadastrado."
        : undefined);

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto grid min-h-full max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs tracking-[0.22em] text-primary uppercase">Regional Uberlândia-MG</p>
          <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Entrar no DRP</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            O acesso é pelo e-mail Google cadastrado no Darpe. Nesta prévia local, use um dos e-mails de
            demonstração para abrir os painéis de secretaria, coordenação e colaborador.
          </p>
        </div>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <Flash erro={erro} />
            {googleEnabled ? (
              <form action={googleSignIn} className="mb-6">
                <Button className="w-full" type="submit">
                  Entrar com Google
                </Button>
              </form>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">
                Google OAuth ainda não está configurado neste ambiente. Use um e-mail de demonstração.
              </p>
            )}
            <form action={demoSignIn} className="grid gap-3">
              <Field label="E-mail cadastrado">
                <input className={controlClass} type="email" name="email" required placeholder="secretaria@darpe.local" />
              </Field>
              <Button type="submit">Entrar com e-mail de demonstração</Button>
            </form>
            <div className="mt-6 space-y-2">
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Contas de prévia</p>
              {DEMO.map((item) => (
                <form action={demoSignIn} key={item.email}>
                  <input type="hidden" name="email" value={item.email} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.role}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{item.email}</span>
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              <Link href="/definicao" className="underline-offset-4 hover:underline">
                Ler a definição e o PRD
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

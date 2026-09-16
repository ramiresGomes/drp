import Link from "next/link";

const ITEMS = [
  { href: "/app/admin/pessoas", label: "Pessoas" },
  { href: "/app/admin/instituicoes", label: "Instituições" },
  { href: "/app/admin/vinculos", label: "Vínculos" },
  { href: "/app/admin/cidades", label: "Cidades e comuns" },
  { href: "/app/admin/series", label: "Séries" },
  { href: "/app/admin/eventos", label: "Eventos" },
  { href: "/app/admin/notificacoes", label: "Avisos" },
  { href: "/app/admin/moderacao", label: "Moderação" },
  { href: "/app/admin/lgpd", label: "LGPD" },
  { href: "/app/admin/incidentes", label: "Incidentes" },
  { href: "/app/admin/aprovacoes", label: "Dupla aprovação" },
  { href: "/app/admin/auditoria", label: "Auditoria" },
  { href: "/app/admin/relatorios", label: "Relatórios" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            current === item.href || current.startsWith(`${item.href}/`)
              ? "rounded-full bg-primary px-3 py-1.5 text-xs whitespace-nowrap text-primary-foreground"
              : "rounded-full border border-border px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground hover:bg-muted"
          }
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

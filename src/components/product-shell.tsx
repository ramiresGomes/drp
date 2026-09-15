"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { canUseCoordinatorPanel, isAdmin, type CurrentPerson } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function navFor(person: CurrentPerson) {
  const items = [
    { href: "/app", label: "Início", description: "Números e pendências" },
    { href: "/app/agenda", label: "Agenda", description: "Atendimentos e eventos" },
    { href: "/app/notificacoes", label: "Avisos", description: "Ciência e confirmação" },
    { href: "/app/dados", label: "Meus dados", description: "Cadastro Darpe" },
  ];
  if (canUseCoordinatorPanel(person)) {
    items.splice(1, 0, {
      href: "/app/coordenacao",
      label: "Coordenação",
      description: "Escala e presença",
    });
  }
  if (isAdmin(person)) {
    items.splice(1, 0, {
      href: "/app/admin",
      label: "Secretaria",
      description: "Cadastros da regional",
    });
  }
  return items;
}

function NavLinks({
  person,
  onNavigate,
}: {
  person: CurrentPerson;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {navFor(person).map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2.5 transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <span className="block text-sm font-medium">{item.label}</span>
            <span className="mt-0.5 block text-xs text-sidebar-foreground/60">{item.description}</span>
          </Link>
        );
      })}
      <Link
        href="/definicao"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/70"
      >
        <span className="block text-sm font-medium">PRD e definição</span>
        <span className="mt-0.5 block text-xs text-sidebar-foreground/60">Documento vivo</span>
      </Link>
    </nav>
  );
}

function LogoutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form action={logout}>
      <Button type="submit" variant={variant} className={className}>
        <LogOut data-icon="inline-start" />
        Sair
      </Button>
    </form>
  );
}

export function ProductShell({
  person,
  children,
}: {
  person: CurrentPerson;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-5 py-6">
          <p className="text-xs tracking-[0.2em] text-sidebar-primary uppercase">Regional Uberlândia</p>
          <p className="mt-1 font-heading text-2xl text-sidebar-foreground">DRP</p>
          <p className="mt-1 text-sm text-sidebar-foreground/70">{person.name}</p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <NavLinks person={person} />
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3">
          <LogoutButton className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground" />
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="md:hidden">
            <p className="text-xs tracking-[0.18em] text-primary uppercase">DRP</p>
            <p className="text-sm text-muted-foreground">{person.name}</p>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            {person.email} · sessão nesta regional
          </p>
          <div className="flex items-center gap-2">
            <LogoutButton className="hidden md:inline-flex" />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir navegação" />}>
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="border-b border-sidebar-border">
                  <SheetTitle className="text-sidebar-foreground">Menu DRP</SheetTitle>
                </SheetHeader>
                <NavLinks person={person} onNavigate={() => setOpen(false)} />
                <div className="p-3">
                  <LogoutButton className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground" />
                </div>
              </SheetContent>
            </Sheet>
            <LogoutButton className="md:hidden" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

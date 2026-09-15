"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
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
            <span className="mt-0.5 block text-xs text-sidebar-foreground/60">
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-5 py-6">
          <p className="text-xs tracking-[0.2em] text-sidebar-primary uppercase">
            Regional Uberlândia
          </p>
          <p className="mt-1 font-heading text-2xl text-sidebar-foreground">DRP</p>
          <p className="mt-1 text-sm text-sidebar-foreground/70">
            Definição e PRD do Darpe
          </p>
        </div>
        <ScrollArea className="flex-1">
          <NavLinks />
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/entrar"
            className="block rounded-lg bg-sidebar-accent px-3 py-2 text-sm text-sidebar-accent-foreground"
          >
            Abrir o sistema operacional
          </Link>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="text-xs tracking-[0.18em] text-primary uppercase">DRP</p>
            <p className="text-sm text-muted-foreground">Darpe Uberlândia</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Abrir navegação" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="border-b border-sidebar-border">
                <SheetTitle className="text-sidebar-foreground">Navegação DRP</SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="border-t border-sidebar-border p-3">
                <Link
                  href="/entrar"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-sidebar-accent px-3 py-2 text-sm text-sidebar-accent-foreground"
                >
                  Abrir o sistema operacional
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-20 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

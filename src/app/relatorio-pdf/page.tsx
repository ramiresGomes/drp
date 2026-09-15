import { PrintReportButton } from "@/components/print-report";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/permissions";
import { getCurrentPerson } from "@/lib/session";
import { isAnonymized, loadReportTable, reportQuery, type ReportFilters } from "@/lib/reports";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportFilters>;
}) {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) redirect("/entrar");
  const params = await searchParams;
  const table = await loadReportTable(params);
  const query = reportQuery({ ...params, fato: table.fato, anonimizado: isAnonymized(params) ? "1" : "0" });
  const backHref = `/app/admin/relatorios${query.size ? `?${query.toString()}` : ""}`;

  return (
    <main className="mx-auto max-w-5xl bg-background px-6 py-8 text-foreground">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button render={<Link href={backHref} />} variant="outline">
          Voltar aos relatórios
        </Button>
        <PrintReportButton />
      </div>
      <p className="text-xs tracking-[0.18em] text-primary uppercase">DRP · Regional Uberlândia</p>
      <h1 className="mt-2 font-heading text-3xl">{table.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {table.anonymized ? "Relatório amplo anonimizado." : "Recorte com identificação de pessoas."}
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {table.header.map((cell) => (
              <th key={cell} className="border border-border bg-muted/50 px-2 py-1.5 text-left font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="border border-border px-2 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

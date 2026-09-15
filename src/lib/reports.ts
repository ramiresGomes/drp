export type ReportFilters = {
  setor?: string | null;
  cidade?: string | null;
  situacao?: string | null;
  fato?: string | null;
  anonimizado?: string | null;
};

export function occurrenceReportWhere(params: ReportFilters) {
  return {
    ...(params.setor ? { series: { institution: { sectorId: params.setor } } } : {}),
    ...(params.cidade ? { series: { institution: { cityId: params.cidade } } } : {}),
    ...(params.situacao === "cancelado" ? { cancelled: true } : {}),
    ...(params.situacao === "realizado" ? { cancelled: false, closedAt: { not: null } } : {}),
    ...(params.situacao === "previsto" ? { cancelled: false, closedAt: null } : {}),
  };
}

export function reportQuery(params: ReportFilters) {
  const query = new URLSearchParams();
  if (params.setor) query.set("setor", params.setor);
  if (params.cidade) query.set("cidade", params.cidade);
  if (params.situacao) query.set("situacao", params.situacao);
  if (params.fato && params.fato !== "atendimentos") query.set("fato", params.fato);
  if (params.anonimizado === "0") query.set("anonimizado", "0");
  return query;
}

export function isAnonymized(params: ReportFilters) {
  return params.anonimizado !== "0";
}

export function csvLine(cells: Array<string | number>) {
  return cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";");
}

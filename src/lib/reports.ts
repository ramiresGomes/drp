export function occurrenceReportWhere(params: {
  setor?: string | null;
  cidade?: string | null;
  situacao?: string | null;
}) {
  return {
    ...(params.setor ? { series: { institution: { sectorId: params.setor } } } : {}),
    ...(params.cidade ? { series: { institution: { cityId: params.cidade } } } : {}),
    ...(params.situacao === "cancelado" ? { cancelled: true } : {}),
    ...(params.situacao === "realizado" ? { cancelled: false, closedAt: { not: null } } : {}),
    ...(params.situacao === "previsto" ? { cancelled: false, closedAt: null } : {}),
  };
}

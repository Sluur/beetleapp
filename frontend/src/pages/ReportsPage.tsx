import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import TopSpeciesList from "../components/TopSpeciesList";
import { getObservationSummary, downloadObservationsCsv, type ObservationSummary, downloadObservationsPdf } from "../lib/reports";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [summary, setSummary] = useState<ObservationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function loadSummary(opts?: { from?: string; to?: string }) {
    try {
      setLoading(true);
      setError("");
      const data = await getObservationSummary(opts);
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Error al cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  function handleApplyFilters() {
    const filters: { from?: string; to?: string } = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;
    void loadSummary(filters);
  }

  function handleClearFilters() {
    setFromDate("");
    setToDate("");
    void loadSummary();
  }

  function handleExportCsv() {
    const filters: { from?: string; to?: string } = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;
    downloadObservationsCsv(filters);
  }

  function handleExportPdf() {
    const filters: { from?: string; to?: string } = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;
    void downloadObservationsPdf(filters);
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reportes de observaciones
            </h1>
            <p className="text-sm text-slate-600 mt-2">Estadísticas básicas de tus observaciones y especies identificadas</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 
                       bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 
                       hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              📊 Exportar CSV
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 
                       bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 
                       hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>


        <div className="mb-8 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Desde</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 
                           outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                           transition-all duration-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hasta</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 
                           outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                           transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 
                         hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="rounded-xl bg-linear-to-r from-blue-500 to-indigo-500 px-6 py-2.5 text-sm font-bold text-white 
                         hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-sm text-slate-500 font-medium">Cargando resumen...</div>
          </div>
        )}

        {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 font-medium">{error}</div>}

        {!loading && summary && (
          <div className="flex flex-col gap-8">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <StatCard
                title="Total de observaciones"
                value={summary.total_observations}
                subtitle={summary.filters.from || summary.filters.to ? `En el rango seleccionado` : `En todo el historial`}
              />
              <StatCard
                title="Especies distintas"
                value={summary.distinct_species_count}
                subtitle="Según la especie asociada o etiqueta inferida"
              />
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Top especies</h2>
              <TopSpeciesList items={summary.species_counts} />
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Observaciones por día</h2>
              {summary.observations_by_date.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                  <div className="text-slate-400 text-3xl mb-2">📭</div>
                  <p className="text-sm text-slate-600 font-medium">No hay observaciones en este rango</p>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-5 shadow-lg">
                  <ul className="divide-y-2 divide-slate-100 text-sm">
                    {summary.observations_by_date.map((d) => (
                      <li key={d.date} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <span className="text-slate-700 font-medium">{d.date}</span>
                        <span className="px-3 py-1 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs">
                          {d.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

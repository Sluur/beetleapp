import { api } from "./api";

export type ObservationSummary = {
  filters: {
    from: string | null;
    to: string | null;
  };
  total_observations: number;
  distinct_species_count: number;
  species_counts: { label: string; count: number }[];
  observations_by_date: { date: string; count: number }[];
};

export type SummaryFilters = {
  from?: string; // "YYYY-MM-DD"
  to?: string; // "YYYY-MM-DD"
};

// GET /api/reports/observations/summary/
export async function getObservationSummary(filters?: SummaryFilters): Promise<ObservationSummary> {
  const { data } = await api.get("/reports/observations/summary/", {
    params: {
      from: filters?.from || undefined,
      to: filters?.to || undefined,
    },
  });
  return data as ObservationSummary;
}

// GET /api/reports/observations/export/ 
export async function downloadObservationsCsv(filters?: SummaryFilters) {
  const { data } = await api.get("/reports/observations/export/", {
    params: {
      from: filters?.from || undefined,
      to: filters?.to || undefined,
    },
    responseType: "blob",
  });

  const blob = new Blob([data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "observations_export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// GET /api/reports/observations/export_pdf/
export async function downloadObservationsPdf(filters?: SummaryFilters) {
  const { data } = await api.get("/reports/observations/export_pdf/", {
    params: {
      from: filters?.from || undefined,
      to: filters?.to || undefined,
    },
    responseType: "blob",
  });

  const blob = new Blob([data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "observations_report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

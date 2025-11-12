import { api } from "./api";

/** ===== Tipos ===== */
export type Inference = {
  id: number;
  predicted_label: string;
  confidence: number; // tu backend guarda float; si es 0..1 o 0..100 lo decidís en UI
  is_correct: boolean | null;
  created_at?: string;
};

export type Observation = {
  id: number;
  date: string; // "YYYY-MM-DD"
  latitude: number | string; // puede venir como string por DecimalField
  longitude: number | string;
  place_text?: string;
  photo?: string | null; // path relativo (si lo exponés)
  photo_url?: string | null; // URL absoluta (serializer)
  created_at: string;
  inference?: Inference | null;
};

export type PredictPreview = {
  label: string;
  confidence: number;
  version?: string;
};

function cleanServerError(err: any): never {
  const msg =
    err?.response?.data?.detail ??
    (typeof err?.response?.data === "string" && !/^<!DOCTYPE/i.test(err.response.data)
      ? err.response.data
      : err?.message ?? "Error desconocido");
  throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
}

/** ===== API ===== */

// POST /api/predict_preview/
export async function predictPreview(file: File): Promise<PredictPreview> {
  try {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/predict_preview/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as PredictPreview;
  } catch (err) {
    cleanServerError(err);
  }
}

// GET /api/observations/?search&ordering&page
export async function listObservations(params?: { search?: string; ordering?: string; page?: number }) {
  try {
    const { data } = await api.get("/observations/", { params });
    // si DRF pagination está activa, viene {count,next,previous,results}
    return Array.isArray(data) ? (data as Observation[]) : (data.results as Observation[]);
  } catch (err) {
    cleanServerError(err);
  }
}

// POST /api/observations/
export async function createObservation(formData: FormData): Promise<Observation> {
  try {
    const { data } = await api.post("/observations/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as Observation;
  } catch (err) {
    cleanServerError(err);
  }
}

// POST /api/observations/:id/classify/
export async function classifyObservation(observationId: number): Promise<Inference> {
  try {
    const { data } = await api.post(`/observations/${observationId}/classify/`);
    return data as Inference;
  } catch (err) {
    cleanServerError(err);
  }
}

// POST /api/inferences/:id/validate/
export async function validateInference(inferenceId: number, isCorrect: boolean) {
  try {
    const { data } = await api.post(`/inferences/${inferenceId}/validate/`, { is_correct: isCorrect });
    return data as { ok: true };
  } catch (err) {
    cleanServerError(err);
  }
}

// Opcionales útiles (si los usás en otras pantallas)
export async function getObservation(id: number) {
  const { data } = await api.get(`/observations/${id}/`);
  return data as Observation;
}

export async function updateObservation(id: number, form: FormData | Record<string, any>) {
  const isFD = typeof FormData !== "undefined" && form instanceof FormData;
  const { data } = await api.patch(`/observations/${id}/`, form, {
    headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return data as Observation;
}

export async function deleteObservation(id: number) {
  await api.delete(`/observations/${id}/`);
}

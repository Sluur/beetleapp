// src/lib/apiClient.ts
import { api } from "./api";

/** ===== Tipos ===== */
export type Inference = {
  id: number;
  predicted_label: string;
  confidence: number; // 0..100
  is_correct: boolean | null;
  created_at?: string;
};

export type Observation = {
  id: number;
  date: string; // "YYYY-MM-DD"
  latitude: number | string; // si viene como string del backend decimal
  longitude: number | string;
  place_text?: string;
  photo?: string; // path relativo
  photo_url?: string; // URL absoluta
  created_at: string;
  inference?: Inference | null;
};

export type PredictPreview = {
  label: string;
  confidence: number;
  version?: string;
};

/** ===== Helpers ===== */

function cleanServerError(err: any): never {
  // devuelve un mensaje más claro
  const msg =
    err?.response?.data?.detail ??
    (typeof err?.response?.data === "string" && !/^<!DOCTYPE/i.test(err.response.data)
      ? err.response.data
      : err?.message ?? "Error desconocido");
  throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
}

/** ===== API ===== */

// Para la tarjeta de predicción (frontend → Django → Flask)
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

export async function listObservations(params?: { search?: string; ordering?: string }): Promise<Observation[]> {
  try {
    const { data } = await api.get("/observations/", { params });
    // DRF list devuelve {results:[]} si usas pagination; si no, es un array
    return Array.isArray(data) ? (data as Observation[]) : (data.results as Observation[]);
  } catch (err) {
    cleanServerError(err);
  }
}

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

export async function classifyObservation(observationId: number): Promise<Inference> {
  try {
    const { data } = await api.post(`/observations/${observationId}/classify/`);
    return data as Inference;
  } catch (err) {
    cleanServerError(err);
  }
}

export async function validateInference(inferenceId: number, isCorrect: boolean) {
  try {
    const { data } = await api.post(`/inferences/${inferenceId}/validate/`, {
      is_correct: isCorrect,
    });
    return data as { ok: true };
  } catch (err) {
    cleanServerError(err);
  }
}

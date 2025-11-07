import { api } from "./api";

export async function createObservation(formData: FormData) {
  const { data } = await api.post("/observations/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { id, observation }
}
export async function getObservation(id: number) {
  const { data } = await api.get(`/observations/${id}/`);
  return data;
}

export async function updateObservation(id: number, form: FormData | Record<string, any>) {
  const isFD = typeof FormData !== "undefined" && form instanceof FormData;
  const { data } = await api.patch(`/observations/${id}/`, form, {
    headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return data;
}

export async function deleteObservation(id: number) {
  await api.delete(`/observations/${id}/`);
}

export async function classifyObservation(observationId: number) {
  const { data } = await api.post(`/observations/${observationId}/classify/`);
  return data; // { id, predicted_label, confidence, ... }
}

export async function validateInference(inferenceId: number, isCorrect: boolean) {
  const { data } = await api.post(`/inferences/${inferenceId}/validate/`, {
    is_correct: isCorrect,
  });
  return data;
}

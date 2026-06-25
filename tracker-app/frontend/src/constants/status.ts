export type Estado =
  | "aplicado"
  | "dm_enviado"
  | "en_contacto"
  | "entrevista"
  | "prueba_tecnica"
  | "oferta"
  | "rechazado"
  | "sin_respuesta";

export const STATUS_ORDER: Estado[] = [
  "aplicado",
  "dm_enviado",
  "en_contacto",
  "entrevista",
  "prueba_tecnica",
  "oferta",
  "rechazado",
  "sin_respuesta",
];

export function nextStatus(estado: Estado): Estado {
  const idx = STATUS_ORDER.indexOf(estado);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export const STATUS_LABELS: Record<Estado, string> = {
  aplicado: "Aplicado",
  dm_enviado: "DM Enviado",
  en_contacto: "En Contacto",
  entrevista: "Entrevista",
  prueba_tecnica: "Prueba Técnica",
  oferta: "Oferta",
  rechazado: "Rechazado",
  sin_respuesta: "Sin Respuesta",
};

export const STATUS_COLORS: Record<
  Estado,
  { bg: string; text: string }
> = {
  aplicado: { bg: "#EFF6FF", text: "#1D4ED8" },
  dm_enviado: { bg: "#F5F3FF", text: "#5B21B6" },
  en_contacto: { bg: "#FFFBEB", text: "#92400E" },
  entrevista: { bg: "#FFF7ED", text: "#9A3412" },
  prueba_tecnica: { bg: "#FFF7ED", text: "#EA580C" },
  oferta: { bg: "#ECFDF5", text: "#065F46" },
  rechazado: { bg: "#FEF2F2", text: "#991B1B" },
  sin_respuesta: { bg: "#F9FAFB", text: "#374151" },
};

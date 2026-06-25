import type { Estado } from "@/constants/status";

export type Plataforma =
  | "Torre"
  | "GetOnBoard"
  | "Manfred"
  | "LinkedIn"
  | "Otro";

export interface ApplicationIn {
  empresa: string;
  rol: string;
  fecha: string;
  estado: Estado;
  plataforma?: Plataforma | null;
  contacto?: string | null;
  proximo_paso?: string | null;
  notas?: string | null;
}

export interface ApplicationOut extends ApplicationIn {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface StatsOut {
  total: number;
  response_rate: number;
  active_interviews: number;
  offers: number;
  need_followup: string[];
}

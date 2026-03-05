import type { Database } from "@/shared/types/database.types";

export type ConsultationStatus = Database["public"]["Enums"]["consultation_status"];

export type Consultation = Database["public"]["Tables"]["consultations"]["Row"];

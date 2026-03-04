export interface Store {
  id: string;
  franchise_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  pg_merchant_key: string | null;
  is_active: boolean;
  avg_prep_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  store_id: string;
  table_number: number;
  qr_code_url: string | null;
  current_session_id: string;
}

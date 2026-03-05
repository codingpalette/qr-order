-- 016_consultations.sql
-- 랜딩 페이지 상담 신청 저장 테이블

CREATE TYPE consultation_status AS ENUM ('pending', 'contacted', 'completed');

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  store_name TEXT NOT NULL,
  email TEXT,
  message TEXT,
  status consultation_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);

CREATE TRIGGER consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 비인증 사용자도 상담 신청 가능 (INSERT만)
CREATE POLICY "Anyone can insert consultations"
  ON consultations FOR INSERT
  WITH CHECK (true);

-- system_admin만 조회/수정 가능
CREATE POLICY "System admin can read consultations"
  ON consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'system_admin' AND is_approved = TRUE
    )
  );

CREATE POLICY "System admin can update consultations"
  ON consultations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'system_admin' AND is_approved = TRUE
    )
  );

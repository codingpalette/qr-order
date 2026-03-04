-- tables에 current_session_id 추가 (기본값: 새 UUID 자동 생성)
ALTER TABLE tables ADD COLUMN current_session_id UUID NOT NULL DEFAULT gen_random_uuid();

-- orders에 session_id 추가 (nullable, 기존 주문 호환)
ALTER TABLE orders ADD COLUMN session_id UUID;

-- 고객이 tables에서 current_session_id를 읽을 수 있도록 anon SELECT 정책 추가
CREATE POLICY "anon_tables_select" ON tables
  FOR SELECT USING (TRUE);

-- session_id 기반 조회 성능을 위한 인덱스
CREATE INDEX idx_orders_session ON orders(session_id);

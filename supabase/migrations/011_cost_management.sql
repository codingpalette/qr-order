-- 원가 관리: master_menus, local_menus에 cost_price 컬럼 추가
ALTER TABLE master_menus ADD COLUMN cost_price INTEGER DEFAULT NULL;
ALTER TABLE local_menus ADD COLUMN cost_price INTEGER DEFAULT NULL;

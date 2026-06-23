-- ============================================================
-- SM(음성소망의료재단) 직원 profiles 일괄 생성
-- 배경: create-staff-accounts.mjs 는 auth 계정만 만들고 profiles 행은
--       만들지 않아, SM 134명이 로그인 후 프로필 없음(!p)으로 튕겼다. (BUG-004)
-- staff_directory 기반으로 누락된 profiles 를 생성한다. (idempotent)
-- employment_status='재직', is_approver=false 기본.
--   (승인자/슈퍼관리자는 별도 마이그레이션에서 설정)
-- ============================================================
INSERT INTO profiles (
  id, corporation_id, employee_id, full_name, department, position,
  is_super_admin, is_approver, employment_status, lang
)
SELECT
  sd.profile_id, sd.corporation_id, sd.employee_id, sd.full_name, sd.department, sd.position,
  false, false, '재직', 'ko'
FROM staff_directory sd
WHERE sd.employee_id LIKE 'SM-%'
  AND sd.profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = sd.profile_id);

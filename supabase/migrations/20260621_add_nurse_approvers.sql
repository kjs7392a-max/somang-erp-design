-- 수간호사(김미현) · 병원장(김태우) Supabase 계정 및 결재자 권한 생성

-- ── 1. auth.users 삽입 ─────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  -- 김미현 수간호사
  (
    'b0240000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kimmihy@somang.kr', '', now(),
    now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', '', ''
  ),
  -- 김태우 병원장(진료원장)
  (
    'b0030000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kimtaewoo@somang.kr', '', now(),
    now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. profiles 삽입 ───────────────────────────────────────────────
INSERT INTO profiles (
  id, corporation_id, employee_id,
  full_name, department, position,
  is_super_admin, is_approver, is_global_viewer,
  employment_status, lang
)
VALUES
  (
    'b0240000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'SM-0024',
    '김미현', '간호과', '수간호사',
    false, true, false,
    '재직', 'ko'
  ),
  (
    'b0030000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'SM-0003',
    '김태우', '진료부', '병원장',
    false, true, false,
    '재직', 'ko'
  )
ON CONFLICT (id) DO NOTHING;

-- ── 3. staff_directory profile_id 연결 ────────────────────────────
UPDATE staff_directory SET profile_id = 'b0240000-0000-0000-0000-000000000001'
WHERE employee_id = 'SM-0024';

UPDATE staff_directory SET profile_id = 'b0030000-0000-0000-0000-000000000001'
WHERE employee_id = 'SM-0003';

-- ============================================================
-- 공지 권한 구조: announcements + wards + notice_departments + RLS
-- 전체공지(SM 총무과 / HD 기획실) · 부서공지(화이트리스트) · 병동공지(간호과)
-- 설계: docs/superpowers/specs/2026-06-27-announcement-permissions-design.md
-- ============================================================

-- 1) 전체공지 작성 주체 부서 (법인별)
ALTER TABLE corporations ADD COLUMN IF NOT EXISTS company_notice_dept text;
UPDATE corporations SET company_notice_dept = '총무과' WHERE short_name = 'SM';
UPDATE corporations SET company_notice_dept = '기획실' WHERE short_name = 'HD';

-- 2) 간호사 소속 병동 (명단은 추후 적재 — 지금은 전부 NULL)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ward text;

-- 3) 병동 목록
CREATE TABLE IF NOT EXISTS wards (
  corporation_id uuid NOT NULL REFERENCES corporations(id),
  code           text NOT NULL,
  sort_order     int  DEFAULT 0,
  PRIMARY KEY (corporation_id, code)
);
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wards_read ON wards;
CREATE POLICY wards_read ON wards FOR SELECT USING (true);

INSERT INTO wards (corporation_id, code, sort_order) VALUES
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','1',1),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','2',2),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','3',3),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','5',4),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','8',5),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','9',6),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','10-A',7),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','10-B',8),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','11',9),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','12',10),
  ('c2000000-0000-0000-0000-000000000002','101',1),
  ('c2000000-0000-0000-0000-000000000002','102',2),
  ('c2000000-0000-0000-0000-000000000002','103',3),
  ('c2000000-0000-0000-0000-000000000002','105',4),
  ('c2000000-0000-0000-0000-000000000002','106',5),
  ('c2000000-0000-0000-0000-000000000002','107',6),
  ('c2000000-0000-0000-0000-000000000002','108',7)
ON CONFLICT (corporation_id, code) DO NOTHING;

-- 4) 부서공지 가능 부서 화이트리스트
CREATE TABLE IF NOT EXISTS notice_departments (
  corporation_id uuid NOT NULL REFERENCES corporations(id),
  department     text NOT NULL,
  PRIMARY KEY (corporation_id, department)
);
ALTER TABLE notice_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notice_departments_read ON notice_departments;
CREATE POLICY notice_departments_read ON notice_departments FOR SELECT USING (true);

INSERT INTO notice_departments (corporation_id, department) VALUES
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','총무과'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','원무과'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','사회복지과'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','약국'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','영양과'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','간호과'),
  ('c2000000-0000-0000-0000-000000000002','원무과'),
  ('c2000000-0000-0000-0000-000000000002','사회복지과'),
  ('c2000000-0000-0000-0000-000000000002','영양과'),
  ('c2000000-0000-0000-0000-000000000002','간호과')
ON CONFLICT (corporation_id, department) DO NOTHING;

-- 5) 현재 사용자 프로필 헬퍼 (SECURITY DEFINER — profiles RLS 우회)
CREATE OR REPLACE FUNCTION public.my_corp() RETURNS uuid
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS
$$ SELECT corporation_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.my_dept() RETURNS text
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS
$$ SELECT department FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.my_ward() RETURNS text
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS
$$ SELECT ward FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.is_super() RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS
$$ SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()), false) $$;

GRANT EXECUTE ON FUNCTION public.my_corp(), public.my_dept(), public.my_ward(), public.is_super()
  TO authenticated, anon;

-- 6) 공지 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id uuid NOT NULL REFERENCES corporations(id),
  scope          text NOT NULL CHECK (scope IN ('company','dept','ward')),
  target_dept    text,
  target_ward    text,
  title          text NOT NULL,
  body           text NOT NULL,
  content        text,
  author_id      uuid REFERENCES profiles(id),
  author_name    text,
  author_dept    text,
  pinned         boolean DEFAULT false,
  title_i18n     jsonb DEFAULT '{}'::jsonb,
  body_i18n      jsonb DEFAULT '{}'::jsonb,
  published_at   timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now(),
  CONSTRAINT ann_scope_chk CHECK (
       (scope = 'company' AND target_dept IS NULL AND target_ward IS NULL)
    OR (scope = 'dept'    AND target_dept IS NOT NULL AND target_ward IS NULL)
    OR (scope = 'ward'    AND target_dept = '간호과' AND target_ward IS NOT NULL)
  ),
  -- 병동 유효성: ward 행의 (corporation_id, target_ward)는 실제 wards 행이어야 함.
  -- company/dept 행은 target_ward NULL → MATCH SIMPLE로 검사 제외.
  CONSTRAINT announcements_ward_fk FOREIGN KEY (corporation_id, target_ward)
    REFERENCES wards (corporation_id, code)
);
CREATE INDEX IF NOT EXISTS announcements_corp_scope_idx
  ON announcements (corporation_id, scope, published_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 읽기: 내 법인 + (전체 / 내 부서 / 내 병동). super_admin 전체.
DROP POLICY IF EXISTS ann_select ON announcements;
-- author_id = auth.uid(): 작성자는 자기 글을 항상 봄.
--   (PostgREST INSERT...RETURNING이 SELECT 정책을 타므로 필수 — 없으면 my_ward()=NULL인
--    간호사가 병동공지 작성 시 RETURNING 단계에서 42501로 막힘.)
CREATE POLICY ann_select ON announcements FOR SELECT TO authenticated USING (
  public.is_super() OR author_id = auth.uid() OR (
    corporation_id = public.my_corp() AND (
         scope = 'company'
      OR (scope = 'dept' AND target_dept = public.my_dept())
      OR (scope = 'ward' AND target_ward = public.my_ward())
    )
  )
);

-- 작성 권한식 (insert/update/delete 공통):
--   company → 내 부서 = 법인의 company_notice_dept
--   dept    → 내 부서 = target_dept 이고 화이트리스트에 존재
--   ward    → 내 부서 = 간호과 이고 target_ward 가 내 법인 병동
DROP POLICY IF EXISTS ann_insert ON announcements;
CREATE POLICY ann_insert ON announcements FOR INSERT TO authenticated WITH CHECK (
  public.is_super() OR (
    corporation_id = public.my_corp() AND (
         (scope = 'company' AND public.my_dept() = (SELECT company_notice_dept FROM corporations WHERE id = public.my_corp()))
      OR (scope = 'dept' AND target_dept = public.my_dept()
            AND EXISTS (SELECT 1 FROM notice_departments nd WHERE nd.corporation_id = public.my_corp() AND nd.department = public.my_dept()))
      OR (scope = 'ward' AND public.my_dept() = '간호과')
    )
  )
);

DROP POLICY IF EXISTS ann_update ON announcements;
CREATE POLICY ann_update ON announcements FOR UPDATE TO authenticated
USING (
  public.is_super() OR (
    corporation_id = public.my_corp() AND (
         (scope = 'company' AND public.my_dept() = (SELECT company_notice_dept FROM corporations WHERE id = public.my_corp()))
      OR (scope = 'dept' AND target_dept = public.my_dept()
            AND EXISTS (SELECT 1 FROM notice_departments nd WHERE nd.corporation_id = public.my_corp() AND nd.department = public.my_dept()))
      OR (scope = 'ward' AND public.my_dept() = '간호과')
    )
  )
)
WITH CHECK (
  public.is_super() OR (
    corporation_id = public.my_corp() AND (
         (scope = 'company' AND public.my_dept() = (SELECT company_notice_dept FROM corporations WHERE id = public.my_corp()))
      OR (scope = 'dept' AND target_dept = public.my_dept()
            AND EXISTS (SELECT 1 FROM notice_departments nd WHERE nd.corporation_id = public.my_corp() AND nd.department = public.my_dept()))
      OR (scope = 'ward' AND public.my_dept() = '간호과')
    )
  )
);

DROP POLICY IF EXISTS ann_delete ON announcements;
CREATE POLICY ann_delete ON announcements FOR DELETE TO authenticated USING (
  public.is_super() OR (
    corporation_id = public.my_corp() AND (
         (scope = 'company' AND public.my_dept() = (SELECT company_notice_dept FROM corporations WHERE id = public.my_corp()))
      OR (scope = 'dept' AND target_dept = public.my_dept()
            AND EXISTS (SELECT 1 FROM notice_departments nd WHERE nd.corporation_id = public.my_corp() AND nd.department = public.my_dept()))
      OR (scope = 'ward' AND public.my_dept() = '간호과')
    )
  )
);

-- 7) 기존 mock 공지 이전 (홈 표시 유지) — i18n은 번역 기능 별도 진행이라 한국어만 seed
-- 전체공지: SM·HD 양쪽
INSERT INTO announcements (corporation_id, scope, title, body, author_name, author_dept, pinned, published_at) VALUES
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','company','2026년 4월 20일 통합 워크숍 안내','전 직원 대상 통합 워크숍을 4월 20일(월) 오전 9시부터 본관 대강당에서 실시합니다. 참석 대상은 별도 공지를 확인해주세요.','김행정 팀장','인사팀',true,'2026-04-15'),
  ('c2000000-0000-0000-0000-000000000002','company','2026년 4월 20일 통합 워크숍 안내','전 직원 대상 통합 워크숍을 4월 20일(월) 오전 9시부터 본관 대강당에서 실시합니다. 참석 대상은 별도 공지를 확인해주세요.','김행정 팀장','인사팀',true,'2026-04-15'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','company','사내 메신저 시스템 점검 안내','4월 22일(수) 02:00~04:00 동안 메신저 서버 점검이 있습니다. 해당 시간 로그인이 제한됩니다.','박시스 과장','정보전산팀',false,'2026-04-14'),
  ('c2000000-0000-0000-0000-000000000002','company','사내 메신저 시스템 점검 안내','4월 22일(수) 02:00~04:00 동안 메신저 서버 점검이 있습니다. 해당 시간 로그인이 제한됩니다.','박시스 과장','정보전산팀',false,'2026-04-14');

-- 부서공지: SM 총무과
INSERT INTO announcements (corporation_id, scope, target_dept, title, body, author_name, author_dept, pinned, published_at) VALUES
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','dept','총무과','5월 비품 신청 마감 안내','5월 비품 신청 마감일은 4월 25일(금)입니다. 각 부서 비품 신청서를 기한 내 총무과로 제출해 주시기 바랍니다.','한기석 총무과장','총무과',true,'2026-04-16'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','dept','총무과','총무과 내부 회의 일정 변경','4월 23일(수) 예정이던 총무과 주간회의가 4월 24일(목) 오전 10시로 변경되었습니다. 참고하시기 바랍니다.','한기석 총무과장','총무과',false,'2026-04-15');

-- 부서공지: SM 간호과 (병동 명단 적재 전이라 간호과 전체 대상으로 임시 seed)
INSERT INTO announcements (corporation_id, scope, target_dept, title, body, author_name, author_dept, pinned, published_at) VALUES
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','dept','간호과','5월 근무표 배포 안내','5월 근무표가 확정되어 배포되었습니다. 변경사항 확인 후 이상 있으면 수간호사에게 문의 바랍니다.','이수간 수간호사','간호과',true,'2026-04-15'),
  ('cc363f81-7b81-4eea-8d7d-86803741a0cf','dept','간호과','간호과 감염관리 교육 일정','4월 28일(화) 13:00 감염관리 교육을 진행합니다. 전원 참석 바랍니다.','정감염 감염관리전담','간호과',false,'2026-04-12');

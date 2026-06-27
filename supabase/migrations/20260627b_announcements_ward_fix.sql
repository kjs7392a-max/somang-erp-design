-- ============================================================
-- ward(병동) 작성 권한 거부 버그 수정
-- 원인: RLS WITH CHECK 안의 상관 서브쿼리(EXISTS ... w.code = target_ward)에서
--       새 행 컬럼 target_ward 상관참조가 평가되지 않아 간호과 ward insert가 전부 막힘.
--       (dept 가지는 함수 my_dept() 참조라 정상 동작 — 대조로 확인됨)
-- 해결: 병동 유효성은 복합 FK로 강제하고, ward 정책 가지에서 서브쿼리 제거.
-- ============================================================

-- 1) 병동 유효성 FK. company/dept 행은 target_ward NULL → MATCH SIMPLE로 검사 제외.
--    ward 행은 (corporation_id, target_ward) 가 실제 wards 행이어야 함.
ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_ward_fk;
ALTER TABLE announcements
  ADD CONSTRAINT announcements_ward_fk
  FOREIGN KEY (corporation_id, target_ward)
  REFERENCES wards (corporation_id, code);

-- 2) 정책 재작성 — ward 가지에서 EXISTS 제거 (유효성은 위 FK가 보장).
--    corporation_id = my_corp() (바깥) + FK → 내 법인의 실제 병동만 허용.
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

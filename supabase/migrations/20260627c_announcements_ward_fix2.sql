-- 병동공지 최종 보정 (이미 테이블이 생성된 DB에 적용하는 fix-forward)
-- 1) 병동 유효성 FK (멱등)
-- 2) ann_select에 작성자 본인 가시성 추가
--    — PostgREST INSERT...RETURNING이 SELECT 정책을 타므로, my_ward()=NULL(명단 미적재)인
--      간호사가 병동공지를 작성하면 RETURNING 단계에서 42501로 막혔다. author_id=auth.uid()로 해결.
-- 3) insert/update/delete의 ward 가지에서 상관 서브쿼리 제거(유효성은 FK가 보장)

ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_ward_fk;
ALTER TABLE announcements ADD CONSTRAINT announcements_ward_fk
  FOREIGN KEY (corporation_id, target_ward) REFERENCES wards (corporation_id, code);

DROP POLICY IF EXISTS ann_select ON announcements;
CREATE POLICY ann_select ON announcements FOR SELECT TO authenticated USING (
  public.is_super() OR author_id = auth.uid() OR (
    corporation_id = public.my_corp() AND (
         scope = 'company'
      OR (scope = 'dept' AND target_dept = public.my_dept())
      OR (scope = 'ward' AND target_ward = public.my_ward())
    )
  )
);

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

-- 한기석(SM-0016, 총무과장)에게 결재 권한 부여
-- 효과: 결재함 탭 노출, 자신에게 배정된 기안 처리 가능
UPDATE profiles
SET is_approver = true
WHERE id = '0cab6761-8cb2-44ab-bb24-00acebe9dfde'; -- 한기석

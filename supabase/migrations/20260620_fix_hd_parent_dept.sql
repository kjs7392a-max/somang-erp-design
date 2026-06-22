-- 현대병원 직원 parent_dept 보정 (엑셀 기준)
UPDATE staff_directory SET parent_dept = '진료부'     WHERE employee_id IN ('HD-0001','HD-0002','HD-0003','HD-0004','HD-0005');
UPDATE staff_directory SET parent_dept = '원무과'     WHERE employee_id IN ('HD-0006','HD-0007','HD-0008','HD-0009','HD-0010','HD-0011');
UPDATE staff_directory SET parent_dept = '기획실'     WHERE employee_id IN ('HD-0012','HD-0013','HD-0014');
UPDATE staff_directory SET parent_dept = '약국'       WHERE employee_id IN ('HD-0015','HD-0016');
UPDATE staff_directory SET parent_dept = '영양과'     WHERE employee_id IN ('HD-0017','HD-0018','HD-0019','HD-0020','HD-0021','HD-0022');
UPDATE staff_directory SET parent_dept = '임상병리과' WHERE employee_id = 'HD-0023';
UPDATE staff_directory SET parent_dept = '방사선과'   WHERE employee_id = 'HD-0024';
UPDATE staff_directory SET parent_dept = '물리치료과' WHERE employee_id = 'HD-0025';
UPDATE staff_directory SET parent_dept = '사회복지과' WHERE employee_id IN ('HD-0026','HD-0027','HD-0028');
UPDATE staff_directory SET parent_dept = '임상심리과' WHERE employee_id = 'HD-0029';
UPDATE staff_directory SET parent_dept = '안전관리실' WHERE employee_id = 'HD-0030';
UPDATE staff_directory SET parent_dept = '차량운행과' WHERE employee_id IN ('HD-0031','HD-0032');
UPDATE staff_directory SET parent_dept = '시설관리과' WHERE employee_id IN ('HD-0033','HD-0034','HD-0035','HD-0036');
UPDATE staff_directory SET parent_dept = '간호부'     WHERE employee_id BETWEEN 'HD-0037' AND 'HD-0069';

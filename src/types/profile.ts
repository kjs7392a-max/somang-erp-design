export type Profile = {
  id: string;
  employee_id: string;
  name: string;
  corporation_id: string;
  department_id: string | null;
  department_name: string | null;  // departments 테이블 join 결과 (표시용)
  position_name: string | null;
  job_title: string | null;
  employment_status: string;
  is_approver: boolean;
  is_department_head: boolean;
  is_global_viewer: boolean;
  receives_final_approval_notifications: boolean;
  kakao_notify_enabled: boolean;
  remember_login_id_enabled: boolean;
  created_at: string;
  updated_at: string;
};

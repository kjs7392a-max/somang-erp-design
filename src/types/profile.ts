export type Lang = "ko" | "ru" | "zh" | "uz" | "uk";

export type Profile = {
  id: string;
  corporation_id: string;
  employee_id: string | null;
  full_name: string;
  department: string;
  position: string;
  is_super_admin: boolean;
  is_approver: boolean;
  employment_status: string;
  is_global_viewer: boolean;
  lang: Lang;
  created_at: string;
  updated_at: string;
};

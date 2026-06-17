import type { CalendarEvent } from "@/types/calendar";
import { MOCK_EVENTS } from "@/lib/calendar-data";
import type { Lang } from "@/types/profile";

/* ---------- 공지 ---------- */
export type Announcement = {
  id: string;
  scope: "company" | "dept";
  title: string;
  body: string;
  content?: string;
  author?: string;
  department?: string;
  /** dept 공지의 대상 부서 — scope가 "dept"일 때만 사용 */
  targetDept?: string;
  date: string;
  pinned?: boolean;
  /** 다국어 제목 — 없으면 title(한국어) 사용 */
  titleI18n?: Partial<Record<Lang, string>>;
  /** 다국어 본문 — 없으면 body(한국어) 사용 */
  bodyI18n?: Partial<Record<Lang, string>>;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a-c-1",
    scope: "company",
    title: "2026년 4월 20일 통합 워크숍 안내",
    body: "전 직원 대상 통합 워크숍을 4월 20일(월) 오전 9시부터 본관 대강당에서 실시합니다. 참석 대상은 별도 공지를 확인해주세요.",
    author: "김행정 팀장",
    department: "인사팀",
    date: "2026-04-15",
    pinned: true,
    titleI18n: {
      ru: "Объявление о совместном семинаре 20 апреля 2026",
      zh: "2026年4月20日综合研讨会通知",
      uz: "2026-yil 20-aprel seminar haqida e'lon",
      uk: "Оголошення про корпоративний семінар 20 квітня 2026",
    },
    bodyI18n: {
      ru: "Семинар для всех сотрудников пройдёт 20 апреля (пн) в 09:00 в главном актовом зале. Уточните список участников в отдельном объявлении.",
      zh: "全体员工综合研讨会将于4月20日（周一）上午9时在主楼大礼堂举行，请查看另行通知了解参会名单。",
      uz: "20-aprel (dushanba) kuni soat 09:00 da bosh bino asosiy zalida barcha xodimlar uchun seminar bo'ladi. Ishtirokchilar ro'yxati uchun alohida e'lonni ko'ring.",
      uk: "Семінар для всіх співробітників відбудеться 20 квітня (пн) о 9:00 у головному актовому залі. Список учасників — в окремому оголошенні.",
    },
  },
  {
    id: "a-c-2",
    scope: "company",
    title: "사내 메신저 시스템 점검 안내",
    body: "4월 22일(수) 02:00~04:00 동안 메신저 서버 점검이 있습니다. 해당 시간 로그인이 제한됩니다.",
    author: "박시스 과장",
    department: "정보전산팀",
    date: "2026-04-14",
    titleI18n: {
      ru: "Техническое обслуживание корпоративного мессенджера",
      zh: "企业通讯系统维护通知",
      uz: "Korporativ messenjer texnik xizmat ko'rsatish",
      uk: "Технічне обслуговування корпоративного месенджера",
    },
    bodyI18n: {
      ru: "22 апреля (ср) с 02:00 до 04:00 будет проводиться техническое обслуживание сервера. В это время вход в систему будет ограничен.",
      zh: "4月22日（周三）02:00至04:00进行服务器维护，期间无法登录。",
      uz: "22-aprel (chorshanba) 02:00 dan 04:00 gacha server texnik xizmatda bo'ladi. Bu vaqtda tizimga kirish cheklanadi.",
      uk: "22 квітня (ср) з 02:00 до 04:00 проводитиметься технічне обслуговування сервера. Вхід до системи буде обмежено.",
    },
  },
  {
    id: "a-d-1",
    scope: "dept",
    targetDept: "간호과",
    title: "11병동 근무표 변경 공지",
    body: "5월 근무표가 확정되어 배포되었습니다. 변경사항 확인 후 이상 있으면 수간호사에게 문의 바랍니다.",
    author: "이수간 수간호사",
    department: "11병동",
    date: "2026-04-15",
    pinned: true,
    titleI18n: {
      ru: "Изменение графика смен 11-го отделения",
      zh: "11病房班次表变更通知",
      uz: "11-bo'lim ish jadvali o'zgarishi",
      uk: "Зміна графіка змін 11-го відділення",
    },
    bodyI18n: {
      ru: "График смен на май утверждён и опубликован. Если есть расхождения, обратитесь к старшей медсестре.",
      zh: "5月班次表已确认并发布，如有疑问请联系护士长。",
      uz: "May oyi ish jadvali tasdiqlandi va tarqatildi. Farqlar bo'lsa bosh hamshiraga murojaat qiling.",
      uk: "Графік змін на травень затверджено та опубліковано. Якщо є розбіжності, зверніться до старшої медсестри.",
    },
  },
  {
    id: "a-d-2",
    scope: "dept",
    targetDept: "간호과",
    title: "11병동 감염관리 교육 일정",
    body: "4월 28일(화) 13:00 11병동 스테이션에서 감염관리 교육을 진행합니다. 전원 참석 바랍니다.",
    author: "정감염 감염관리전담",
    department: "감염관리실",
    date: "2026-04-12",
    titleI18n: {
      ru: "Обучение по инфекционному контролю — 11-е отделение",
      zh: "11病房感染管理培训安排",
      uz: "11-bo'limda infeksiya nazorati bo'yicha o'qitish",
      uk: "Навчання з інфекційного контролю — 11-е відділення",
    },
    bodyI18n: {
      ru: "28 апреля (вт) в 13:00 на посту 11-го отделения состоится обучение по инфекционному контролю. Присутствие обязательно.",
      zh: "4月28日（周二）13:00在11病房护士站进行感染管理培训，全员必须参加。",
      uz: "28-aprel (seshanba) soat 13:00 da 11-bo'lim stantsiyasida infeksiya nazorati bo'yicha o'qitish bo'ladi. Barcha ishtirok etishi shart.",
      uk: "28 квітня (вт) о 13:00 на посту 11-го відділення відбудеться навчання з інфекційного контролю. Присутність обов'язкова.",
    },
  },
  {
    id: "a-d-3",
    scope: "dept",
    targetDept: "총무과",
    title: "5월 비품 신청 마감 안내",
    body: "5월 비품 신청 마감일은 4월 25일(금)입니다. 각 부서 비품 신청서를 기한 내 총무과로 제출해 주시기 바랍니다.",
    author: "한기석 총무과장",
    department: "총무과",
    date: "2026-04-16",
    pinned: true,
  },
  {
    id: "a-d-4",
    scope: "dept",
    targetDept: "총무과",
    title: "총무과 내부 회의 일정 변경",
    body: "4월 23일(수) 예정이던 총무과 주간회의가 4월 24일(목) 오전 10시로 변경되었습니다. 참고하시기 바랍니다.",
    author: "한기석 총무과장",
    department: "총무과",
    date: "2026-04-15",
  },
];

/* ---------- 월차 ---------- */
export const LEAVE_INFO = {
  total: 15,
  used: 2,
  remaining: 13,
  carriedOver: 0,
  monthly: [
    { month: "1월", used: 0 },
    { month: "2월", used: 1 },
    { month: "3월", used: 1 },
    { month: "4월", used: 0 },
  ],
};

/* ---------- 오늘 할 일 ---------- */
export function getTodayEvents(today = new Date()): CalendarEvent[] {
  const iso = toISO(today);
  return MOCK_EVENTS.filter((e) => e.date === iso).slice(0, 3);
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 공지의 언어별 제목/본문을 반환 (없으면 한국어 원본) */
export function getAnnouncementText(
  item: Announcement,
  lang: Lang,
): { title: string; body: string } {
  return {
    title: (lang !== "ko" && item.titleI18n?.[lang]) || item.title,
    body:  (lang !== "ko" && item.bodyI18n?.[lang])  || item.body,
  };
}

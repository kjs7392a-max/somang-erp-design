// 전 직원 Supabase 계정 일괄 생성
// 비밀번호 규칙: 사번 + 1234 (예: SM-00161234)
// 실행: node scripts/create-staff-accounts.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://bnlybtvdqyfxmbrcvcnv.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORP_DOMAIN = {
  "cc363f81-7b81-4eea-8d7d-86803741a0cf": "somang.internal",
  "c2000000-0000-0000-0000-000000000002": "hyundai.internal",
};

async function main() {
  // 전 직원 조회
  const { data: staff, error } = await supabase
    .from("staff_directory")
    .select("id, employee_id, corporation_id, full_name, profile_id")
    .order("employee_id");

  if (error) {
    console.error("staff_directory 조회 실패:", error.message);
    process.exit(1);
  }

  console.log(`총 ${staff.length}명 처리 시작\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const s of staff) {
    const domain = CORP_DOMAIN[s.corporation_id];
    if (!domain) {
      console.warn(`[SKIP] ${s.employee_id} — 알 수 없는 법인`);
      skipped++;
      continue;
    }

    // 이미 계정이 있는 경우 스킵
    if (s.profile_id) {
      console.log(`[SKIP] ${s.employee_id} (${s.full_name}) — 이미 계정 있음`);
      skipped++;
      continue;
    }

    const email = `${s.employee_id.toLowerCase()}@${domain}`;
    const password = `${s.employee_id}1234`;

    const { data: user, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          employee_id: s.employee_id,
          full_name: s.full_name,
        },
      });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        // 이미 존재 → UUID 조회 후 profile_id 연결
        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing?.users?.find((u) => u.email === email);
        if (found) {
          await supabase
            .from("staff_directory")
            .update({ profile_id: found.id })
            .eq("id", s.id);
          console.log(`[LINK] ${s.employee_id} (${s.full_name}) — 기존 계정 연결`);
          skipped++;
        }
      } else {
        console.error(`[FAIL] ${s.employee_id} — ${createError.message}`);
        failed++;
      }
      continue;
    }

    // profile_id 업데이트
    await supabase
      .from("staff_directory")
      .update({ profile_id: user.user.id })
      .eq("id", s.id);

    console.log(`[OK]   ${s.employee_id} (${s.full_name}) → ${email}`);
    created++;
  }

  console.log(`\n완료: 생성 ${created}명 / 스킵 ${skipped}명 / 실패 ${failed}명`);
}

main();

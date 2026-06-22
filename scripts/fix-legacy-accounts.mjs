// 기존 수동 생성 계정 이메일을 사번 형식으로 업데이트
// 대상: 한기석(SM-0016), 윤민주(SM-0029)
// 실행: node scripts/fix-legacy-accounts.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://bnlybtvdqyfxmbrcvcnv.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGETS = [
  {
    profile_id: "0cab6761-8cb2-44ab-bb24-00acebe9dfde",
    employee_id: "SM-0016",
    full_name: "한기석",
    new_email: "sm-0016@somang.internal",
    new_password: "SM-00161234",
  },
  {
    profile_id: "460358a6-85aa-4418-bd6b-f1127aa37646",
    employee_id: "SM-0029",
    full_name: "윤민주",
    new_email: "sm-0029@somang.internal",
    new_password: "SM-00291234",
  },
];

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.employee_id}] ${t.full_name} 처리 중...`);

    // 현재 이메일 확인
    const { data: user, error: getErr } =
      await supabase.auth.admin.getUserById(t.profile_id);

    if (getErr || !user?.user) {
      console.error(`  [FAIL] 사용자 조회 실패: ${getErr?.message}`);
      continue;
    }

    console.log(`  현재 이메일: ${user.user.email}`);

    // 이미 새 형식이면 스킵
    if (user.user.email === t.new_email) {
      console.log(`  [SKIP] 이미 올바른 이메일`);
      continue;
    }

    // 이메일 + 비밀번호 업데이트
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      t.profile_id,
      { email: t.new_email, password: t.new_password, email_confirm: true }
    );

    if (updateErr) {
      console.error(`  [FAIL] 업데이트 실패: ${updateErr.message}`);
      continue;
    }

    console.log(`  [OK] ${t.new_email} / ${t.new_password}`);
  }

  console.log("\n완료.");
}

main();

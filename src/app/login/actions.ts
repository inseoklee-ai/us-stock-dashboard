"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseEmail, parsePassword } from "@/lib/validation";

export type AuthState = {
  error?: string;
  message?: string;
};

/**
 * 로그인/회원가입 통합 액션. 폼의 hidden "mode" 값으로 분기한다.
 * useActionState 와 함께 사용.
 */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "login");

  const e = parseEmail(formData.get("email"));
  if (!e.ok) return { error: e.error };
  const pw = parsePassword(formData.get("password"));
  if (!pw.ok) return { error: pw.error };
  const email = e.value;
  const password = pw.value;

  const supabase = await createClient();

  if (mode === "signup") {
    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("host")}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/confirm` },
    });
    if (error) {
      return { error: error.message };
    }
    // 이메일 확인이 켜져 있으면 session 이 없다 → 확인 안내
    if (!data.session) {
      return {
        message:
          "확인 이메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료한 뒤 로그인하세요.",
      };
    }
    // 이메일 확인이 꺼져 있으면 바로 로그인됨 → 아래로 진행
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: "로그인 실패: 이메일 또는 비밀번호를 확인하세요." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/portfolio");
}

/** 로그아웃. <form action={signOut}> 로 호출. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

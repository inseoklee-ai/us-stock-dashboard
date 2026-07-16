"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseTicker, type FormState } from "@/lib/validation";

/** 관심 종목 추가. useActionState 와 함께 사용. */
export async function addWatch(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = parseTicker(formData.get("ticker"));
  if (!t.ok) return { error: t.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 중복이면 무시 (watchlist 는 (user_id, ticker) unique)
  const { error } = await supabase
    .from("watchlist")
    .upsert(
      { user_id: user.id, ticker: t.value },
      { onConflict: "user_id,ticker", ignoreDuplicates: true },
    );
  if (error) return { error: `추가 실패: ${error.message}` };

  revalidatePath("/feed");
  return { success: true };
}

/** 관심 종목 삭제. */
export async function removeWatch(formData: FormData): Promise<void> {
  const ticker = String(formData.get("ticker") ?? "").trim();
  if (!ticker) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", ticker);

  revalidatePath("/feed");
}

import { signOut } from "@/app/login/actions";

/** 로그아웃 버튼. 서버 컴포넌트 — form action 으로 signOut 서버 액션 호출. */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
      >
        로그아웃
      </button>
    </form>
  );
}

import { signOut } from "@/app/login/actions";

/** 로그아웃 버튼. 서버 컴포넌트 — form action 으로 signOut 서버 액션 호출. */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-800 hover:underline dark:hover:text-gray-200"
      >
        로그아웃
      </button>
    </form>
  );
}

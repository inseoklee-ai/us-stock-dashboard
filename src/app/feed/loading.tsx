import { Spinner } from "@/components/Spinner";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">관심 &amp; 소식</h1>
      <Spinner label="소식을 불러오는 중…" />
    </main>
  );
}

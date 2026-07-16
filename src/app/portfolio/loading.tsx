import { Spinner } from "@/components/Spinner";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">포트폴리오</h1>
      <Spinner />
    </main>
  );
}

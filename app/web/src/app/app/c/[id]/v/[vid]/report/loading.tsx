import { Bone, PageHead } from "@/components/app/Skeleton";

/** The printable approval report. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[860px] px-5 py-8 sm:px-10">
      <PageHead back />
      <div className="mt-8 rounded-[22px] border border-line bg-white p-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="mt-3 h-5 first:mt-0" />
        ))}
      </div>
    </main>
  );
}

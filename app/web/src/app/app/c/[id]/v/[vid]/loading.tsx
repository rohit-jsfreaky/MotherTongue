import { Bone, PageHead } from "@/components/app/Skeleton";

/** A version's review page: player on the left, the script lines on the right. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-10">
      <PageHead back />
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Bone className="aspect-[9/16] rounded-[22px]" />
        <div className="min-w-0">
          <div className="flex gap-3 border-b border-line pb-3">
            <Bone className="h-6 w-16" />
            <Bone className="h-6 w-28" />
            <Bone className="h-6 w-20" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mt-3 rounded-[18px] border border-line bg-white p-4">
              <Bone className="h-3.5 w-36" />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Bone className="h-12" />
                <Bone className="h-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

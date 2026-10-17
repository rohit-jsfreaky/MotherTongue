import { Bone, PageHead } from "@/components/app/Skeleton";

/** Campaigns: shows at once on click while the campaigns load. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-10">
      <PageHead aside />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-[22px] border border-line bg-white p-4 shadow-card">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((j) => (
                <Bone key={j} className="aspect-[9/16] flex-1" />
              ))}
            </div>
            <Bone className="mt-4 h-5 w-40" />
            <Bone className="mt-2.5 h-4 w-56" />
          </div>
        ))}
      </div>
    </main>
  );
}

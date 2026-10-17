import { Bone, PageHead } from "@/components/app/Skeleton";

/** A campaign: its four version cards appear as frames at once, the videos fill in when they load. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-10">
      <PageHead back aside />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
            <Bone className="aspect-[9/16] rounded-none" />
            <div className="p-4">
              <Bone className="h-4 w-32" />
              <Bone className="mt-2.5 h-5 w-40 rounded-full" />
              <Bone className="mt-3 h-9 w-full rounded-[11px]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

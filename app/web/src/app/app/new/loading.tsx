import { Bone } from "@/components/app/Skeleton";

/** New campaign: the three steps and the first step's card. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1040px] px-5 py-8 sm:px-10">
      <Bone className="h-8 w-56" />
      <Bone className="mt-2.5 h-4 w-96 max-w-full" />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-12 flex-1 rounded-[14px]" />
        ))}
      </div>
      <div className="mt-5 rounded-[22px] border border-line bg-white p-6 shadow-card">
        <Bone className="h-10 w-80 rounded-[12px]" />
        <Bone className="mt-6 h-11 rounded-[12px]" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-40 rounded-[16px]" />
          ))}
        </div>
      </div>
    </main>
  );
}

import { Bone } from "@/components/app/Skeleton";

/** Brand memory: one card per brand. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[980px] px-5 py-8 sm:px-10">
      <div className="flex items-center gap-3">
        <Bone className="size-11 rounded-2xl" />
        <div>
          <Bone className="h-8 w-48" />
          <Bone className="mt-2 h-4 w-96 max-w-full" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-8 rounded-[22px] border border-line bg-white p-5 shadow-card">
          <Bone className="h-5 w-28" />
          <Bone className="mt-4 h-14 rounded-[16px]" />
          <Bone className="mt-4 h-10 rounded-[12px]" />
        </div>
      ))}
    </main>
  );
}

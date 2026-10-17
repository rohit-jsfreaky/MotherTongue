/** Grey placeholder blocks for loading.tsx: the page's frame shows the instant a link is clicked. */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[10px] bg-line/70 ${className}`} />;
}

export function PageHead({ back = false, aside = false }: { back?: boolean; aside?: boolean }) {
  return (
    <>
      {back && <Bone className="h-4 w-28" />}
      <div className={`flex flex-wrap items-end gap-4 ${back ? "mt-4" : ""}`}>
        <div>
          <Bone className="h-8 w-64" />
          <Bone className="mt-2.5 h-4 w-80 max-w-full" />
        </div>
        {aside && <Bone className="ml-auto h-10 w-44 rounded-[12px]" />}
      </div>
    </>
  );
}

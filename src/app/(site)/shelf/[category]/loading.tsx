export default function Loading() {
  return (
    <div className="container-cpb pt-6 pb-20" aria-busy="true" aria-label="Loading the shelf">
      <div className="skeleton h-5 w-48" />
      <div className="skeleton mt-10 mb-12 h-[170px] w-full rounded-2xl" />
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[150px]" />)}
      </div>
    </div>
  );
}

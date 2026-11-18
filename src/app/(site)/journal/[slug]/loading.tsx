export default function Loading() {
  return (
    <div className="container-cpb pt-6 pb-16" aria-busy="true" aria-label="Loading the page">
      <div className="skeleton h-5 w-64" />
      <div className="mt-12 max-w-[680px]">
        <div className="skeleton h-7 w-24 rounded-full" />
        <div className="skeleton mt-5 h-14 w-full" />
        <div className="skeleton mt-3 h-5 w-56" />
        <div className="mt-12 flex flex-col gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-5" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

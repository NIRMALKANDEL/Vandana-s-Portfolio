export default function JournalLoading({ inline = false }: { inline?: boolean }) {
  const grid = (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]" aria-busy="true" aria-label="Loading entries">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-[300px]" />
      ))}
    </div>
  );
  if (inline) return grid;
  return (
    <div className="container-cpb pt-6 pb-20">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton mt-12 h-12 w-80 max-w-full" />
      <div className="skeleton mt-4 mb-12 h-5 w-96 max-w-full" />
      {grid}
    </div>
  );
}

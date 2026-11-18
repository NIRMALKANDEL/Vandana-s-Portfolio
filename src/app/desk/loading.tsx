export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[760px] flex-col gap-5 px-5 py-6" aria-busy="true" aria-label="Opening the desk">
      <div className="flex items-center justify-between"><div className="skeleton h-8 w-40" /><div className="skeleton h-11 w-28 rounded-full" /></div>
      <div className="skeleton mt-8 h-12 w-3/4" />
      {Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-5" style={{ width: `${55 + ((i * 13) % 40)}%` }} />)}
    </div>
  );
}

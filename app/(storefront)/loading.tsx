export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20">
      <div className="h-8 w-48 animate-pulse rounded bg-ivory-300" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] animate-pulse rounded bg-ivory-300" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-ivory-300" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-ivory-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

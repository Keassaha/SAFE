export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-36 bg-neutral-200 rounded-safe-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 w-full bg-neutral-100 rounded-safe-sm" />
        ))}
      </div>
    </div>
  );
}

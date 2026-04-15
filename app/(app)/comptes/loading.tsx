export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-52 bg-neutral-200 rounded-safe-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 bg-neutral-100 rounded-safe-sm" />
        <div className="h-24 bg-neutral-100 rounded-safe-sm" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 w-full bg-neutral-100 rounded-safe-sm" />
        ))}
      </div>
    </div>
  );
}

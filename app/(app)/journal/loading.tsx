export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-44 bg-neutral-200 rounded-safe-sm" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-neutral-100 rounded-safe-sm" />
        ))}
      </div>
    </div>
  );
}

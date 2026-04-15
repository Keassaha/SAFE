export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded-safe-sm" />
      <div className="h-10 w-full max-w-xs bg-neutral-200 rounded-safe-sm" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full bg-neutral-100 rounded-safe-sm" />
        ))}
      </div>
    </div>
  );
}

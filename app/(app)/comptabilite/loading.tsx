export default function ComptabiliteLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-neutral-100 rounded" />
      <div className="flex gap-2 border-b border-neutral-100 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-neutral-100 rounded" />
        ))}
      </div>
      <div className="bg-white rounded-safe shadow-xs overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-neutral-100">
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 w-40 bg-neutral-100 rounded" />
            <div className="h-4 w-20 bg-neutral-100 rounded" />
            <div className="h-4 w-20 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

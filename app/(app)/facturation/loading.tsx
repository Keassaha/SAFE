export default function FacturationLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-neutral-100 rounded" />
        <div className="h-10 w-40 bg-neutral-100 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-safe p-4 shadow-xs">
            <div className="h-3 w-20 bg-neutral-100 rounded mb-2" />
            <div className="h-7 w-24 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-safe shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-neutral-100 rounded" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-neutral-100">
            <div className="h-4 w-20 bg-neutral-100 rounded" />
            <div className="h-4 w-32 bg-neutral-100 rounded" />
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 w-20 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-neutral-100 rounded" />
        <div className="h-10 w-36 bg-neutral-100 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-safe p-4 shadow-xs">
            <div className="h-3 w-16 bg-neutral-100 rounded mb-2" />
            <div className="h-7 w-12 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-safe shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <div className="h-5 w-28 bg-neutral-100 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-neutral-100">
            <div className="h-4 w-36 bg-neutral-100 rounded" />
            <div className="h-4 w-32 bg-neutral-100 rounded" />
            <div className="h-4 w-20 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

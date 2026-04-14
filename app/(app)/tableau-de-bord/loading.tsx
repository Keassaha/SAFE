export default function DashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] p-6 shadow-lg">
        <div className="h-8 w-64 bg-white/10 rounded mb-2" />
        <div className="h-4 w-40 bg-white/10 rounded" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-safe p-4 shadow-xs">
            <div className="h-3 w-20 bg-neutral-100 rounded mb-3" />
            <div className="h-7 w-28 bg-neutral-100 rounded mb-2" />
            <div className="h-3 w-16 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-safe p-6 shadow-xs">
        <div className="h-5 w-48 bg-neutral-100 rounded mb-4" />
        <div className="h-64 bg-neutral-50 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-safe p-6 shadow-xs">
        <div className="h-5 w-40 bg-neutral-100 rounded mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-neutral-100">
            <div className="h-4 w-32 bg-neutral-100 rounded" />
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 w-20 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

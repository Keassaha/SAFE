export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-44 bg-si-canvas rounded-lg" />
      <div className="h-5 w-72 bg-si-canvas rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-si-canvas rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-si-canvas rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-si-canvas rounded-lg" />
        ))}
      </div>
    </div>
  );
}

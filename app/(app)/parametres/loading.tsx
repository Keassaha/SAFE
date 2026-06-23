export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-si-canvas rounded-lg" />
      <div className="h-11 w-full max-w-md bg-si-canvas rounded-lg" />
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-si-canvas rounded-lg" />
        ))}
      </div>
    </div>
  );
}

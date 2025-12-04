export const SkeletonCard = () => (
  <div className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-3 pt-4">
        <div className="w-8 h-8 bg-muted rounded-full" />
        <div className="h-4 bg-muted rounded flex-1" />
      </div>
    </div>
  </div>
);

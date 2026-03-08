const ProductSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
    <div className="relative aspect-[4/5] bg-muted overflow-hidden">
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
    <div className="p-4 space-y-3">
      <div className="h-2.5 w-16 bg-muted rounded-full skeleton-shimmer" />
      <div className="h-4 w-3/4 bg-muted rounded-full skeleton-shimmer" />
      <div className="h-3 w-1/2 bg-muted rounded-full skeleton-shimmer" />
      <div className="flex items-center gap-1 pt-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-3 bg-muted rounded-full skeleton-shimmer" />
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="h-5 w-20 bg-muted rounded-full skeleton-shimmer" />
        <div className="h-9 w-16 bg-muted rounded-xl skeleton-shimmer" />
      </div>
    </div>
  </div>
);

export const ProductSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(count)].map((_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);

export default ProductSkeleton;

const BrandedLoader = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl emerald-gradient shadow-lg animate-pulse">
      <span className="font-arabic text-2xl text-primary-foreground">ك</span>
    </div>
    <div className="space-y-3 w-full max-w-xs">
      <div className="h-3 w-3/4 mx-auto rounded-full bg-muted skeleton-shimmer" />
      <div className="h-3 w-1/2 mx-auto rounded-full bg-muted skeleton-shimmer" />
    </div>
  </div>
);

export default BrandedLoader;

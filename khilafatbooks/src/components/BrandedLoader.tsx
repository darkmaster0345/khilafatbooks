import logo from '@/assets/logo.png';

const BrandedLoader = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
    <img src={logo} alt="Khilafat Books" className="h-14 w-14 rounded-2xl shadow-lg animate-pulse object-contain" />
    <div className="space-y-3 w-full max-w-xs">
      <div className="h-3 w-3/4 mx-auto rounded-full bg-muted skeleton-shimmer" />
      <div className="h-3 w-1/2 mx-auto rounded-full bg-muted skeleton-shimmer" />
    </div>
  </div>
);

export default BrandedLoader;

import logo from '@/assets/logo.png';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const BrandedLoader = () => {
  const [tookTooLong, setTookTooLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTookTooLong(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <img src={logo} alt="Khilafat Books" className="h-14 w-14 rounded-2xl shadow-lg animate-pulse object-contain" />
      <div className="space-y-3 w-full max-w-xs text-center">
        <div className="h-3 w-3/4 mx-auto rounded-full bg-muted skeleton-shimmer" />
        <div className="h-3 w-1/2 mx-auto rounded-full bg-muted skeleton-shimmer" />

        {tookTooLong && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-sm text-muted-foreground mb-4">This is taking longer than expected. Network might be slow.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandedLoader;

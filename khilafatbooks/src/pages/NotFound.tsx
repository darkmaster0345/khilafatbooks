import { SEOHead } from '@/components/SEOHead';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  return (
    <>
      <SEOHead title="404 - Page Not Found | Khilafat Books" description="The page you are looking for does not exist." noIndex={true} />
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-primary/10">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Oops! Page not found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you're looking for might have been moved, deleted, or never existed.
          Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="rounded-xl gap-2">
            <Link to="/"><Home className="h-4 w-4" /> Go to Home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link to="/shop">Browse Shop</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFound;

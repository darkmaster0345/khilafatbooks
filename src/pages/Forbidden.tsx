import { SEOHead } from '@/components/SEOHead';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Lock, ArrowLeft } from "lucide-react";

const Forbidden = () => {
  return (
    <>
      <SEOHead title="403 - Access Forbidden | Khilafat Books" description="You don't have permission to access this page." noIndex={true} />
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-primary/10">403</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Access Forbidden</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          You don't have permission to access this page. If you believe this is an error, please contact our support team.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="rounded-xl gap-2">
            <Link to="/"><Home className="h-4 w-4" /> Go to Home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
            <Link to="/shop"><ArrowLeft className="h-4 w-4" /> Browse Shop</Link>
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Need help? <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">Contact Support</a>
        </p>
      </div>
    </>
  );
};

export default Forbidden;

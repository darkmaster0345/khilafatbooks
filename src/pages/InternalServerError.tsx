import { SEOHead } from '@/components/SEOHead';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

const InternalServerError = () => {
  return (
    <>
      <SEOHead title="500 - Server Error | Khilafat Books" description="Something went wrong on our end. We're working to fix it." noIndex={true} />
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-destructive/10">500</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Something Went Wrong</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          We're experiencing technical difficulties. Our team has been notified and we're working to fix the issue. Please try again later.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="rounded-xl gap-2">
            <Link to="/"><Home className="h-4 w-4" /> Go to Home</Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-xl gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
        <div className="mt-8 p-4 bg-muted rounded-xl max-w-md">
          <p className="text-sm text-muted-foreground">
            If the problem persists, please contact us at{' '}
            <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">ubaid0345@proton.me</a>
            {' '}or WhatsApp: +92 345 2867726
          </p>
        </div>
      </div>
    </>
  );
};

export default InternalServerError;

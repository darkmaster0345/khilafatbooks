import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UsedTagProps {
  conditionDescription?: string | null;
  className?: string;
}

export const UsedTag = ({ conditionDescription, className = '' }: UsedTagProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Badge
        variant="secondary"
        className={`
          cursor-pointer
          bg-amber-500/20 
          text-amber-700 
          hover:bg-amber-500/30
          border-amber-500/30
          animate-pulse
          transition-all
          duration-300
          ${className}
        `}
        onClick={() => setShowDialog(true)}
      >
        <Package className="h-3 w-3 mr-1" />
        <span className="font-semibold">USED</span>
      </Badge>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Package className="h-5 w-5" />
              Pre-Loved Book
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p className="text-foreground">
                This book is pre-owned and has been carefully inspected to ensure good quality.
              </p>
              {conditionDescription && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-1">Condition Details:</p>
                  <p className="text-sm text-amber-700">{conditionDescription}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                By purchasing used books, you help promote sustainability and make knowledge more accessible to everyone.
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsedTag;

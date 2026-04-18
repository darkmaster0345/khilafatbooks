import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useGeneralSettings } from '@/hooks/useGeneralSettings';
import { Button } from '@/components/ui/button';

const MaintenanceModal = () => {
  const { settings } = useGeneralSettings();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (settings.maintenance_mode) {
      const hasSeen = sessionStorage.getItem('hasSeenMaintenancePop');
      if (!hasSeen) {
        setIsOpen(true);
        sessionStorage.setItem('hasSeenMaintenancePop', 'true');
      }
    }
  }, [settings.maintenance_mode]);

  if (!settings.maintenance_mode) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-warning/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>

          <div className="space-y-2">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Notice: Limited Service
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                We are currently experiencing high volume or undergoing maintenance. Your orders and contact responses may take longer than usual to process.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-warning bg-warning/5 px-3 py-1.5 rounded-full border border-warning/10">
            <Clock className="h-3.5 w-3.5" />
            <span>Expected response: 48-72 hours</span>
          </div>

          <Button onClick={() => setIsOpen(false)} className="w-full h-11 rounded-xl">
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceModal;

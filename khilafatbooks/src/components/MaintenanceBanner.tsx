import { AlertCircle } from 'lucide-react';
import { useGeneralSettings } from '@/hooks/useGeneralSettings';
import { motion, AnimatePresence } from 'framer-motion';

const MaintenanceBanner = () => {
  const { settings } = useGeneralSettings();

  if (!settings.maintenance_mode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-warning/10 border-b border-warning/20 text-warning px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Maintenance Mode: Orders and contact responses may take longer than usual. JazakAllah for your patience.</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default MaintenanceBanner;

import WhatsAppIcon from '@/components/WhatsAppIcon';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '923452867726';
const MESSAGE = 'Assalamu Alaikum, I have a question...';

const WhatsAppWidget = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] transition-colors"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </motion.a>
  );
};

export default WhatsAppWidget;

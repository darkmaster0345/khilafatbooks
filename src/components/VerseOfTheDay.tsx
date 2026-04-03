import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;

interface Verse {
  verse_arabic: string;
  verse_english: string;
  reference: string;
}

const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      const { data } = await supabase
        .from('daily_verses')
        .select('verse_arabic, verse_english, reference')
        .limit(100);

      if (data && data.length > 0) {
        // Pick verse based on day of year for daily rotation
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const index = dayOfYear % data.length;
        setVerse(data[index] as Verse);
      }
    };
    fetchVerse();
  }, []);

  if (!verse) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 geometric-pattern opacity-30" />
      <div className="relative container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
        </div>
        <p className="section-heading mb-6">Verse of the Day</p>
        <p className="font-amiri text-2xl md:text-3xl text-foreground leading-loose max-w-2xl mx-auto" dir="rtl">
          {verse.verse_arabic}
        </p>
        <p className="mt-5 text-base md:text-lg text-muted-foreground italic max-w-xl mx-auto leading-relaxed">
          "{verse.verse_english}"
        </p>
        <p className="mt-4 text-sm font-medium text-primary">— {verse.reference}</p>
      </div>
    </motion.section>
  );
};

export default VerseOfTheDay;

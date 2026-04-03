/**
 * Typed Supabase query helpers to work around strict PostgREST type inference.
 * The newer @supabase/supabase-js versions use very strict conditional types
 * that don't always resolve correctly with string literals.
 * 
 * Usage: import { db } from '@/lib/supabase-helpers'
 *        db.from('products').select('*').eq('id', someId)
 */
import { supabase } from '@/integrations/supabase/client';

// Re-export supabase with relaxed typing for query parameters
// This prevents SelectQueryError issues while keeping runtime behavior identical
export const db = supabase as any;

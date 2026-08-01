import { supabase } from '../lib/supabase';
import { Station } from '../types/database.types';

export const getAllStations = async (): Promise<Station[]> => {
  const { data, error } = await supabase
    .from('stations')
    .select('id, code, name_en, name_bn, division, zone, is_major')
    .eq('is_active', true)
    .order('name_en', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Station[];
};

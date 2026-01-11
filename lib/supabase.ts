import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save stock query to database
 */
export async function saveStockQuery(data: {
  emiten: string;
  sector?: string;
  from_date?: string;
  to_date?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;
  arb?: number;
  fraksi?: number;
  total_bid?: number;
  total_offer?: number;
  total_papan?: number;
  rata_rata_bid_ofer?: number;
  a?: number;
  p?: number;
  target_realistis?: number;
  target_max?: number;
}) {
  const { data: result, error } = await supabase
    .from('stock_queries')
    .upsert([data], { onConflict: 'from_date,emiten' })
    .select();

  if (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }

  return result;
}

/**
 * Get session value by key
 */
export async function getSessionValue(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('session')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data.value;
}

/**
 * Upsert session value
 */
export async function upsertSession(key: string, value: string) {
  const { data, error } = await supabase
    .from('session')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select();

  if (error) throw error;
  return data;
}

/**
 * Save watchlist analysis to database (reusing stock_queries table)
 */
export async function saveWatchlistAnalysis(data: {
  from_date: string;  // analysis date
  to_date: string;    // same as from_date for daily analysis
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;       // offer_teratas
  arb?: number;       // bid_terbawah
  fraksi?: number;
  total_bid?: number;
  total_offer?: number;
  total_papan?: number;
  rata_rata_bid_ofer?: number;
  a?: number;
  p?: number;
  target_realistis?: number;
  target_max?: number;
  status?: string;
  error_message?: string;
}) {
  const { data: result, error } = await supabase
    .from('stock_queries')
    .upsert([data], { onConflict: 'from_date,emiten' })
    .select();

  if (error) {
    console.error('Error saving watchlist analysis:', error);
    throw error;
  }

  return result;
}

/**
 * Get watchlist analysis history with optional filters
 */
export async function getWatchlistAnalysisHistory(filters?: {
  emiten?: string;
  sector?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  let query = supabase
    .from('stock_queries')
    .select('*', { count: 'exact' });

  // Handle sorting
  const sortBy = filters?.sortBy || 'from_date';
  const sortOrder = filters?.sortOrder || 'desc';

  if (sortBy === 'combined') {
    // Sort by date then emiten
    query = query
      .order('from_date', { ascending: sortOrder === 'asc' })
      .order('emiten', { ascending: sortOrder === 'asc' });
  } else {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  if (filters?.emiten) {
    const emitenList = filters.emiten.split(/\s+/).filter(Boolean);
    if (emitenList.length > 0) { // Changed to always use .in() if emitens are present
      query = query.in('emiten', emitenList);
    }
  }
  if (filters?.sector) {
    query = query.eq('sector', filters.sector);
  }
  if (filters?.fromDate) {
    query = query.gte('from_date', filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte('from_date', filters.toDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching watchlist analysis:', error);
    throw error;
  }

  return { data, count };
}

/**
 * Get latest stock query for a specific emiten
 */
export async function getLatestStockQuery(emiten: string) {
  const { data, error } = await supabase
    .from('stock_queries')
    .select('*')
    .eq('emiten', emiten)
    .eq('status', 'success')
    .order('from_date', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

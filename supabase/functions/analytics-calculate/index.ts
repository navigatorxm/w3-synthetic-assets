import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const chainId = parseInt(url.searchParams.get('chain_id') || '1', 10);
    
    // Default to yesterday if no date provided
    const targetDate = dateParam 
      ? new Date(dateParam) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    // Fetch transactions for the day
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('chain_id', chainId)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (txError) throw txError;

    // Calculate analytics per token
    const tokenSymbols = ['USDT', 'BTC', 'ETH'] as const;
    const analyticsData = [];

    for (const symbol of tokenSymbols) {
      const tokenTxs = transactions?.filter(tx => tx.token_symbol === symbol) || [];
      
      const mintTxs = tokenTxs.filter(tx => tx.tx_type === 'mint');
      const burnTxs = tokenTxs.filter(tx => tx.tx_type === 'burn');
      const transferTxs = tokenTxs.filter(tx => tx.tx_type === 'transfer');
      
      // Calculate volume (sum of all amounts)
      const volume = tokenTxs.reduce((sum, tx) => {
        return sum + BigInt(tx.amount || '0');
      }, BigInt(0));

      // Count unique active holders from transactions
      const uniqueAddresses = new Set<string>();
      tokenTxs.forEach(tx => {
        if (tx.to_address) uniqueAddresses.add(tx.to_address.toLowerCase());
        if (tx.from_address && tx.from_address !== '0x0000000000000000000000000000000000000000') {
          uniqueAddresses.add(tx.from_address.toLowerCase());
        }
      });

      analyticsData.push({
        date: dateStr,
        token_symbol: symbol,
        volume: volume.toString(),
        transaction_count: tokenTxs.length,
        mint_count: mintTxs.length,
        burn_count: burnTxs.length,
        transfer_count: transferTxs.length,
        active_holders: uniqueAddresses.size,
        new_holders: mintTxs.length, // Approximate: each mint could be a new holder
        chain_id: chainId,
      });
    }

    // Upsert analytics data
    const { error: upsertError } = await supabase
      .from('daily_analytics')
      .upsert(analyticsData, {
        onConflict: 'date,token_symbol,chain_id',
      });

    if (upsertError) throw upsertError;

    // Get updated holder counts
    const { data: holderCounts, error: holderError } = await supabase
      .from('token_holders')
      .select('token_symbol, is_expired')
      .gt('balance', '0');

    if (holderError) throw holderError;

    const holderStats = tokenSymbols.map(symbol => {
      const symbolHolders = holderCounts?.filter(h => h.token_symbol === symbol) || [];
      return {
        symbol,
        total: symbolHolders.length,
        active: symbolHolders.filter(h => !h.is_expired).length,
        expired: symbolHolders.filter(h => h.is_expired).length,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: dateStr,
        chain_id: chainId,
        analytics: analyticsData,
        holder_stats: holderStats,
        transactions_processed: transactions?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics calculation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

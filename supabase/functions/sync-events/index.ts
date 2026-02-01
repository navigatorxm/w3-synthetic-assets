import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionPayload {
  tx_hash: string;
  block_number: number;
  tx_type: 'mint' | 'burn' | 'transfer';
  token_symbol: 'USDT' | 'BTC' | 'ETH';
  from_address: string;
  to_address: string;
  amount: string;
  expiry_timestamp?: number;
  gas_used?: string;
  gas_price?: string;
  chain_id: number;
}

interface HolderUpdate {
  wallet_address: string;
  token_symbol: 'USDT' | 'BTC' | 'ETH';
  balance: string;
  expiry_timestamp?: number;
  is_expired: boolean;
}

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
    
    const { action, data } = await req.json();

    switch (action) {
      case 'sync_transaction': {
        const tx = data as TransactionPayload;
        
        // Insert transaction
        const { error: txError } = await supabase
          .from('transactions')
          .upsert({
            tx_hash: tx.tx_hash,
            block_number: tx.block_number,
            tx_type: tx.tx_type,
            token_symbol: tx.token_symbol,
            from_address: tx.from_address,
            to_address: tx.to_address,
            amount: tx.amount,
            expiry_timestamp: tx.expiry_timestamp,
            gas_used: tx.gas_used,
            gas_price: tx.gas_price,
            chain_id: tx.chain_id,
            status: 'confirmed',
          }, {
            onConflict: 'tx_hash',
          });

        if (txError) throw txError;

        return new Response(
          JSON.stringify({ success: true, message: 'Transaction synced' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_holder': {
        const holder = data as HolderUpdate;
        
        const { error: holderError } = await supabase
          .from('token_holders')
          .upsert({
            wallet_address: holder.wallet_address,
            token_symbol: holder.token_symbol,
            balance: holder.balance,
            expiry_timestamp: holder.expiry_timestamp,
            is_expired: holder.is_expired,
            last_activity_at: new Date().toISOString(),
          }, {
            onConflict: 'wallet_address,token_symbol',
          });

        if (holderError) throw holderError;

        return new Response(
          JSON.stringify({ success: true, message: 'Holder updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_sync_state': {
        const { chain_id, last_block_number } = data;
        
        const { error: syncError } = await supabase
          .from('sync_state')
          .upsert({
            chain_id,
            last_block_number,
            last_sync_at: new Date().toISOString(),
            is_syncing: false,
          }, {
            onConflict: 'chain_id',
          });

        if (syncError) throw syncError;

        return new Response(
          JSON.stringify({ success: true, message: 'Sync state updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_sync_state': {
        const { chain_id } = data;
        
        const { data: syncState, error: getError } = await supabase
          .from('sync_state')
          .select('*')
          .eq('chain_id', chain_id)
          .single();

        if (getError && getError.code !== 'PGRST116') {
          throw getError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: syncState || { chain_id, last_block_number: 0 } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'batch_sync': {
        const { transactions, holders } = data as {
          transactions: TransactionPayload[];
          holders: HolderUpdate[];
        };

        // Batch insert transactions
        if (transactions && transactions.length > 0) {
          const { error: batchTxError } = await supabase
            .from('transactions')
            .upsert(
              transactions.map(tx => ({
                tx_hash: tx.tx_hash,
                block_number: tx.block_number,
                tx_type: tx.tx_type,
                token_symbol: tx.token_symbol,
                from_address: tx.from_address,
                to_address: tx.to_address,
                amount: tx.amount,
                expiry_timestamp: tx.expiry_timestamp,
                gas_used: tx.gas_used,
                gas_price: tx.gas_price,
                chain_id: tx.chain_id,
                status: 'confirmed',
              })),
              { onConflict: 'tx_hash' }
            );

          if (batchTxError) throw batchTxError;
        }

        // Batch update holders
        if (holders && holders.length > 0) {
          const { error: batchHolderError } = await supabase
            .from('token_holders')
            .upsert(
              holders.map(h => ({
                wallet_address: h.wallet_address,
                token_symbol: h.token_symbol,
                balance: h.balance,
                expiry_timestamp: h.expiry_timestamp,
                is_expired: h.is_expired,
                last_activity_at: new Date().toISOString(),
              })),
              { onConflict: 'wallet_address,token_symbol' }
            );

          if (batchHolderError) throw batchHolderError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Synced ${transactions?.length || 0} transactions, ${holders?.length || 0} holders` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Sync events error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

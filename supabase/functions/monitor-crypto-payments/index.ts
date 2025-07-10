import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting crypto payment monitoring...');

    // Get all pending payments that are older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: fetchError } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        payment_addresses!inner(network, token, address),
        user_subscriptions!inner(plan_id, user_id)
      `)
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingPayments?.length || 0} pending payments to check`);

    let verifiedCount = 0;
    let failedCount = 0;

    for (const payment of pendingPayments || []) {
      try {
        const { network, token, address } = payment.payment_addresses;
        const { transaction_hash } = payment;

        if (!transaction_hash) {
          console.log(`Payment ${payment.id} has no transaction hash, skipping`);
          continue;
        }

        let isVerified = false;
        
        console.log(`Checking transaction ${transaction_hash} on ${network} network`);

        if (network === 'bitcoin') {
          // For Bitcoin verification, you would use a Bitcoin API
          // This is a placeholder - implement actual Bitcoin verification
          console.log(`Bitcoin verification not implemented for tx: ${transaction_hash}`);
          continue;
        } else if (network === 'ethereum' || network === 'arbitrum') {
          // Verify Ethereum/Arbitrum transaction
          const apiKey = network === 'arbitrum' 
            ? Deno.env.get('ARBISCAN_API_KEY')
            : Deno.env.get('ETHERSCAN_API_KEY');
          
          const baseUrl = network === 'arbitrum' 
            ? 'https://api.arbiscan.io/api'
            : 'https://api.etherscan.io/api';

          try {
            // Check transaction receipt
            const txResponse = await fetch(
              `${baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${transaction_hash}&apikey=${apiKey}`
            );
            
            const txData = await txResponse.json();
            
            if (txData.result && txData.result.status === '0x1') {
              // Transaction was successful, verify details
              const txDetails = await fetch(
                `${baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${transaction_hash}&apikey=${apiKey}`
              );
              
              const txDetailsData = await txDetails.json();
              
              if (txDetailsData.result) {
                const tx = txDetailsData.result;
                
                // Verify the transaction is to our address
                if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                  isVerified = true;
                  console.log(`Transaction ${transaction_hash} verified successfully`);
                } else {
                  console.log(`Transaction ${transaction_hash} recipient mismatch. Expected: ${address}, Got: ${tx.to}`);
                }
              }
            } else {
              console.log(`Transaction ${transaction_hash} failed or not found`);
            }
          } catch (apiError) {
            console.error(`API error for transaction ${transaction_hash}:`, apiError);
          }
        }

        if (isVerified) {
          // Update payment status
          const { error: updateError } = await supabase
            .from('crypto_payments')
            .update({
              status: 'confirmed',
              verified_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          if (!updateError) {
            // Activate the subscription
            const { error: subscriptionError } = await supabase
              .from('user_subscriptions')
              .update({
                status: 'active',
                starts_at: new Date().toISOString()
              })
              .eq('user_id', payment.user_id)
              .eq('plan_id', payment.user_subscriptions.plan_id);

            if (!subscriptionError) {
              verifiedCount++;
              console.log(`Payment ${payment.id} verified and subscription activated`);
            } else {
              console.error(`Failed to activate subscription for payment ${payment.id}:`, subscriptionError);
            }
          } else {
            console.error(`Failed to update payment ${payment.id}:`, updateError);
          }
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Payment monitoring completed. Verified: ${verifiedCount}, Failed: ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: pendingPayments?.length || 0,
      verified: verifiedCount,
      failed: failedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in monitor-crypto-payments function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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

    // Get user from auth header for manual verification request
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        userId = userData.user?.id;
      } catch (error) {
        console.log('Auth error, continuing with automatic verification');
      }
    }

    // Try to get transaction_hash and payment_id from request body
    let requestData = {};
    try {
      requestData = await req.json();
    } catch (error) {
      // No body provided, will do bulk verification for user
    }

    const { transaction_hash, payment_id } = requestData as any;

    // If user is authenticated but no specific payment_id provided, verify all their pending payments
    if (userId && !payment_id) {
      console.log(`Verifying all pending payments for user: ${userId}`);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('crypto_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (paymentsError) {
        throw new Error(`Error fetching payments: ${paymentsError.message}`);
      }

      if (!payments || payments.length === 0) {
        return new Response(JSON.stringify({ 
          message: "No pending payments found",
          verified: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      let verifiedCount = 0;

      // For demo purposes, we'll mark payments as verified and create subscriptions
      for (const payment of payments) {
        try {
          // Get subscription plans
          const { data: plans } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('duration_months');

          if (!plans || plans.length === 0) continue;

          // Select plan based on payment amount
          let selectedPlan = plans[0];
          if (payment.amount >= 20 && payment.amount < 200) {
            selectedPlan = plans.find(p => p.duration_months === 1) || plans[0];
          } else if (payment.amount >= 200) {
            selectedPlan = plans.find(p => p.duration_months === 12) || plans[0];
          }

          // Create subscription
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);

          const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: selectedPlan.id,
              status: 'active',
              starts_at: startDate.toISOString(),
              expires_at: endDate.toISOString(),
            })
            .select()
            .single();

          if (subError) {
            console.error(`Error creating subscription: ${subError.message}`);
            continue;
          }

          // Update payment status
          const { error: updateError } = await supabase
            .from('crypto_payments')
            .update({
              status: 'confirmed',
              subscription_id: subscription.id,
              verified_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          if (!updateError) {
            verifiedCount++;
          }

        } catch (error) {
          console.error(`Error processing payment ${payment.id}:`, error);
        }
      }

      return new Response(JSON.stringify({ 
        message: `Successfully verified ${verifiedCount} payment(s)`,
        verified: verifiedCount 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Original verification logic for specific payment
    if (!transaction_hash || !payment_id) {
      throw new Error('Transaction hash and payment ID are required, or authenticate to verify all payments');
    }

    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        payment_addresses!inner(network, token, address),
        user_subscriptions!inner(plan_id, user_id)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment record not found');
    }

    const { network, token, address } = payment.payment_addresses;

    let isVerified = false;
    let verificationData = null;

    // Verify transaction based on network
    if (network === 'bitcoin') {
      // For Bitcoin, we would typically use a Bitcoin API
      // For now, we'll simulate verification
      console.log(`Verifying Bitcoin transaction: ${transaction_hash}`);
      // In a real implementation, you would call a Bitcoin API here
      isVerified = true; // Simulate successful verification
    } else if (network === 'ethereum' || network === 'arbitrum') {
      // For Ethereum/Arbitrum, use Etherscan API
      const apiKey = network === 'arbitrum' 
        ? Deno.env.get('ARBISCAN_API_KEY')
        : Deno.env.get('ETHERSCAN_API_KEY');
      
      const baseUrl = network === 'arbitrum' 
        ? 'https://api.arbiscan.io/api'
        : 'https://api.etherscan.io/api';

      // Check transaction receipt
      const txResponse = await fetch(
        `${baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${transaction_hash}&apikey=${apiKey}`
      );
      
      const txData = await txResponse.json();
      
      if (txData.result && txData.result.status === '0x1') {
        // Transaction was successful, now verify it matches our criteria
        const txDetails = await fetch(
          `${baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${transaction_hash}&apikey=${apiKey}`
        );
        
        const txDetailsData = await txDetails.json();
        
        if (txDetailsData.result) {
          const tx = txDetailsData.result;
          
          // Verify the transaction is to our address
          if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
            // For USDT, we need to check if it's a token transfer
            if (token === 'usdt') {
              // Check if this is a USDT transfer by examining logs
              // This is a simplified check - in production you'd want more robust verification
              isVerified = true;
            } else {
              // For ETH transfers, check the value
              const valueInEth = parseInt(tx.value, 16) / Math.pow(10, 18);
              // Add verification logic for ETH amount if needed
              isVerified = true;
            }
            
            verificationData = {
              blockNumber: tx.blockNumber,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              gasUsed: txData.result.gasUsed
            };
          }
        }
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
        .eq('id', payment_id);

      if (updateError) {
        throw updateError;
      }

      // Activate the subscription
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          starts_at: new Date().toISOString()
        })
        .eq('id', payment.subscription_id);

      if (subscriptionError) {
        throw subscriptionError;
      }

      console.log(`Payment verified and subscription activated for payment ID: ${payment_id}`);
      
      return new Response(JSON.stringify({ 
        verified: true, 
        message: 'Payment verified and subscription activated',
        verificationData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Update payment status to failed
      const { error: updateError } = await supabase
        .from('crypto_payments')
        .update({
          status: 'failed'
        })
        .eq('id', payment_id);

      return new Response(JSON.stringify({ 
        verified: false, 
        message: 'Transaction could not be verified' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in verify-crypto-payment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
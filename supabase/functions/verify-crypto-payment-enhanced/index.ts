import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT-ENHANCED] ${step}${detailsStr}`);
};

// USDT contract addresses
const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        userId = userData.user?.id;
        logStep("User authenticated", { userId });
      } catch (error) {
        logStep("Auth error, continuing with automatic verification");
      }
    }

    let requestData = {};
    try {
      requestData = await req.json();
    } catch (error) {
      // No body provided
    }

    const { transaction_hash, payment_id } = requestData as any;
    logStep("Request data", { transaction_hash: transaction_hash ? 'provided' : 'missing', payment_id });

    // If user is authenticated but no specific payment_id provided, verify all their pending payments
    if (userId && !payment_id) {
      logStep("Bulk verification mode for user", { userId });
      
      const { data: payments, error: paymentsError } = await supabase
        .from('crypto_payments')
        .select(`
          *,
          payment_addresses!inner(network, token, address)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (paymentsError) {
        throw new Error(`Error fetching payments: ${paymentsError.message}`);
      }

      if (!payments || payments.length === 0) {
        logStep("No pending payments found");
        return new Response(JSON.stringify({ 
          message: "No pending payments found",
          verified: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      logStep("Found pending payments", { count: payments.length });
      let verifiedCount = 0;

      for (const payment of payments) {
        try {
          logStep("Processing payment", { paymentId: payment.id, txHash: payment.transaction_hash });
          
          if (!payment.transaction_hash) {
            logStep("Skipping payment without transaction hash", { paymentId: payment.id });
            continue;
          }

          const isVerified = await verifyTransaction(
            payment.transaction_hash,
            payment.payment_addresses.network,
            payment.payment_addresses.token,
            payment.payment_addresses.address,
            payment.amount
          );

          if (isVerified) {
            await processSuccessfulPayment(supabase, payment, userId);
            verifiedCount++;
            logStep("Payment verified successfully", { paymentId: payment.id });
          } else {
            logStep("Payment verification failed", { paymentId: payment.id });
          }
        } catch (error) {
          logStep("Error processing payment", { paymentId: payment.id, error: error.message });
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

    // Single payment verification
    if (!transaction_hash || !payment_id) {
      throw new Error('Transaction hash and payment ID are required, or authenticate to verify all payments');
    }

    logStep("Single payment verification mode", { payment_id, transaction_hash: 'provided' });

    const { data: payment, error: paymentError } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        payment_addresses!inner(network, token, address)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment record not found');
    }

    logStep("Payment record found", { 
      paymentId: payment.id, 
      network: payment.payment_addresses.network,
      token: payment.payment_addresses.token 
    });

    const isVerified = await verifyTransaction(
      transaction_hash,
      payment.payment_addresses.network,
      payment.payment_addresses.token,
      payment.payment_addresses.address,
      payment.amount
    );

    if (isVerified) {
      await processSuccessfulPayment(supabase, payment, payment.user_id);
      logStep("Single payment verified successfully", { paymentId: payment.id });
      
      return new Response(JSON.stringify({ 
        verified: true, 
        message: 'Payment verified and subscription activated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      await supabase
        .from('crypto_payments')
        .update({ status: 'failed' })
        .eq('id', payment_id);

      logStep("Single payment verification failed", { paymentId: payment.id });
      
      return new Response(JSON.stringify({ 
        verified: false, 
        message: 'Transaction could not be verified' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    logStep("ERROR in verify-crypto-payment-enhanced", { message: error.message });
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyTransaction(
  transactionHash: string,
  network: string,
  token: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<boolean> {
  logStep("Starting transaction verification", { 
    transactionHash, 
    network, 
    token, 
    expectedAddress: expectedAddress.slice(0, 10) + '...',
    expectedAmount 
  });

  try {
    if (network === 'bitcoin') {
      // For Bitcoin, we'll use a placeholder verification for now
      logStep("Bitcoin verification - placeholder", { transactionHash });
      return true; // TODO: Implement Bitcoin verification
    } else if (network === 'ethereum' || network === 'arbitrum') {
      return await verifyEVMTransaction(transactionHash, network, token, expectedAddress, expectedAmount);
    } else {
      logStep("Unsupported network", { network });
      return false;
    }
  } catch (error) {
    logStep("Transaction verification error", { error: error.message });
    return false;
  }
}

async function verifyEVMTransaction(
  transactionHash: string,
  network: string,
  token: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<boolean> {
  const apiKey = network === 'arbitrum' 
    ? Deno.env.get('ARBISCAN_API_KEY')
    : Deno.env.get('ETHERSCAN_API_KEY');
  
  const baseUrl = network === 'arbitrum' 
    ? 'https://api.arbiscan.io/api'
    : 'https://api.etherscan.io/api';

  logStep("EVM verification starting", { network, token, baseUrl });

  // Check transaction receipt
  const txReceiptResponse = await fetch(
    `${baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${transactionHash}&apikey=${apiKey}`
  );
  
  const txReceiptData = await txReceiptResponse.json();
  logStep("Transaction receipt", { status: txReceiptData.result?.status });
  
  if (!txReceiptData.result || txReceiptData.result.status !== '0x1') {
    logStep("Transaction failed or not found");
    return false;
  }

  // Get transaction details
  const txDetailsResponse = await fetch(
    `${baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${transactionHash}&apikey=${apiKey}`
  );
  
  const txDetailsData = await txDetailsResponse.json();
  
  if (!txDetailsData.result) {
    logStep("Transaction details not found");
    return false;
  }

  const tx = txDetailsData.result;
  logStep("Transaction details", { 
    to: tx.to,
    value: tx.value,
    input: tx.input?.slice(0, 20) + '...'
  });

  if (token === 'usdt') {
    return await verifyUSDTTransfer(txReceiptData.result, expectedAddress, expectedAmount, network);
  } else if (token === 'eth') {
    return verifyETHTransfer(tx, expectedAddress, expectedAmount);
  } else {
    logStep("Unsupported token", { token });
    return false;
  }
}

async function verifyUSDTTransfer(
  txReceipt: any,
  expectedAddress: string,
  expectedAmount: number,
  network: string
): Promise<boolean> {
  const usdtContract = USDT_CONTRACTS[network as keyof typeof USDT_CONTRACTS];
  if (!usdtContract) {
    logStep("USDT contract not found for network", { network });
    return false;
  }

  logStep("Verifying USDT transfer", { 
    usdtContract,
    expectedAddress: expectedAddress.slice(0, 10) + '...',
    expectedAmount 
  });

  // Look for Transfer events in the logs
  const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  
  for (const log of txReceipt.logs || []) {
    if (log.address?.toLowerCase() === usdtContract.toLowerCase() && 
        log.topics?.[0] === transferEventSignature) {
      
      // Decode the transfer event
      const toAddress = '0x' + log.topics[2]?.slice(-40); // Remove padding
      const rawAmount = log.data;
      
      logStep("Found USDT transfer event", { 
        toAddress: toAddress.slice(0, 10) + '...',
        rawAmount: rawAmount.slice(0, 20) + '...'
      });

      // Check if the transfer is to our expected address
      if (toAddress.toLowerCase() === expectedAddress.toLowerCase()) {
        // For USDT, we need to convert from smallest unit (6 decimals)
        const transferAmount = parseInt(rawAmount, 16) / Math.pow(10, 6);
        
        logStep("USDT transfer verification", { 
          transferAmount,
          expectedAmount,
          matches: Math.abs(transferAmount - expectedAmount) < 0.01 
        });

        // Allow small discrepancy for floating point precision
        return Math.abs(transferAmount - expectedAmount) < 0.01;
      }
    }
  }

  logStep("No matching USDT transfer found");
  return false;
}

function verifyETHTransfer(
  tx: any,
  expectedAddress: string,
  expectedAmount: number
): boolean {
  logStep("Verifying ETH transfer", { 
    txTo: tx.to?.slice(0, 10) + '...',
    expectedAddress: expectedAddress.slice(0, 10) + '...',
    txValue: tx.value,
    expectedAmount 
  });

  if (tx.to?.toLowerCase() !== expectedAddress.toLowerCase()) {
    logStep("ETH transfer address mismatch");
    return false;
  }

  const transferAmount = parseInt(tx.value, 16) / Math.pow(10, 18);
  const matches = Math.abs(transferAmount - expectedAmount) < 0.001;
  
  logStep("ETH transfer verification", { transferAmount, expectedAmount, matches });
  return matches;
}

async function processSuccessfulPayment(supabase: any, payment: any, userId: string) {
  logStep("Processing successful payment", { paymentId: payment.id, userId });

  // Get subscription plans to determine which plan to assign
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('duration_months');

  if (!plans || plans.length === 0) {
    throw new Error('No active subscription plans found');
  }

  // Select plan based on payment amount
  let selectedPlan = plans[0];
  if (payment.amount >= 20 && payment.amount < 200) {
    selectedPlan = plans.find(p => p.duration_months === 1) || plans[0];
  } else if (payment.amount >= 200) {
    selectedPlan = plans.find(p => p.duration_months === 12) || plans[0];
  }

  logStep("Selected subscription plan", { 
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    durationMonths: selectedPlan.duration_months 
  });

  // Create or update subscription
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
    logStep("Error creating subscription", { error: subError.message });
    throw subError;
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

  if (updateError) {
    logStep("Error updating payment status", { error: updateError.message });
    throw updateError;
  }

  logStep("Payment processed successfully", { 
    paymentId: payment.id,
    subscriptionId: subscription.id 
  });
}
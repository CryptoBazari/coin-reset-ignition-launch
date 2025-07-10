import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Starting subscription cleanup job...');

    // Cleanup expired payments (older than 24 hours)
    const { data: paymentsResult, error: paymentsError } = await supabaseClient
      .rpc('cleanup_expired_payments');

    if (paymentsError) {
      console.error('❌ Error cleaning up payments:', paymentsError);
    } else {
      console.log(`✅ Cleaned up ${paymentsResult?.expired_payments || 0} expired payments`);
    }

    // Cleanup expired subscriptions
    const { data: subscriptionsResult, error: subscriptionsError } = await supabaseClient
      .rpc('cleanup_expired_subscriptions');

    if (subscriptionsError) {
      console.error('❌ Error cleaning up subscriptions:', subscriptionsError);
    } else {
      console.log(`✅ Cleaned up ${subscriptionsResult?.expired_subscriptions || 0} expired subscriptions`);
    }

    const totalCleaned = (paymentsResult?.expired_payments || 0) + (subscriptionsResult?.expired_subscriptions || 0);

    console.log(`🎉 Cleanup job completed. Total items cleaned: ${totalCleaned}`);

    return new Response(
      JSON.stringify({
        success: true,
        cleaned: {
          payments: paymentsResult?.expired_payments || 0,
          subscriptions: subscriptionsResult?.expired_subscriptions || 0,
          total: totalCleaned
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Subscription cleanup failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
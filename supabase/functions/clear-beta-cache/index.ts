
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🗑️ Clearing Beta cache in database...');

    // Clear all cached Beta values to force recalculation
    const { data, error } = await supabaseClient
      .from('coins')
      .update({ 
        beta: null, 
        beta_confidence: null, 
        beta_last_calculated: null, 
        beta_data_source: null 
      })
      .neq('coin_id', 'dummy'); // Update all rows

    if (error) {
      throw error;
    }

    console.log('✅ Beta cache cleared successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Beta cache cleared - fresh calculations will be performed',
      rowsUpdated: data?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error clearing Beta cache:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

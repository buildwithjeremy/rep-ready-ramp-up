import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RepData {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  trainerName: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { csvData } = await req.json();

    if (!csvData) {
      return new Response(JSON.stringify({ error: 'CSV data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting phone number update from CSV data...');

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    const parsedReps: RepData[] = lines.slice(1).map((line: string) => {
      const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
      
      return {
        fullName: values[0] || '',
        email: values[1] || '',
        phone: values[2]?.replace(/\D/g, '') || '', // Clean phone number
        birthday: values[3] || '',
        address: values[4] || '',
        trainerName: values[5] || ''
      };
    });

    console.log(`Parsed ${parsedReps.length} reps from CSV`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const repData of parsedReps) {
      try {
        if (!repData.email || !repData.phone) {
          console.log(`Skipping ${repData.email} - missing email or phone`);
          continue;
        }

        // Update the rep record with the phone number
        const { error: updateError } = await supabaseAdmin
          .from('reps')
          .update({ 
            phone: repData.phone,
            address: repData.address 
          })
          .eq('email', repData.email.toLowerCase());

        if (updateError) {
          console.error(`Failed to update phone for ${repData.email}:`, updateError);
          errors.push(`${repData.email}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`Updated phone number for ${repData.email}`);
        }

      } catch (error) {
        console.error(`Error processing ${repData.email}:`, error);
        errors.push(`${repData.email}: ${error.message}`);
      }
    }

    console.log(`Phone number update completed. ${updatedCount} successful, ${errors.length} failed`);

    return new Response(JSON.stringify({
      message: 'Phone number update completed',
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Phone number update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
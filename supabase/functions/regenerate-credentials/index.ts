import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Credential {
  fullName: string;
  email: string;
  tempPassword: string;
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

    console.log('Starting credential regeneration for migrated users...');

    // Get all migrated users
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    const migratedUsers = allUsers.users.filter(u => u.user_metadata?.is_migrated === true);

    console.log(`Found ${migratedUsers.length} migrated users`);

    const credentials: Credential[] = [];
    const results: Array<{ email: string; status: string; error?: string }> = [];

    // Get trainer mapping for trainer names
    const { data: trainers } = await supabaseAdmin
      .from('trainers')
      .select('user_id, full_name');

    const trainerMap = new Map();
    trainers?.forEach(t => trainerMap.set(t.user_id, t.full_name));

    for (const user of migratedUsers) {
      try {
        // Generate strong temporary password that meets Supabase requirements
        const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        
        const randomUpper = upperChars[Math.floor(Math.random() * upperChars.length)] + 
                           upperChars[Math.floor(Math.random() * upperChars.length)];
        const randomLower = lowerChars[Math.floor(Math.random() * lowerChars.length)] + 
                           lowerChars[Math.floor(Math.random() * lowerChars.length)];
        const randomNumbers = numbers[Math.floor(Math.random() * numbers.length)] + 
                             numbers[Math.floor(Math.random() * numbers.length)];
        
        const tempPassword = `TT${randomUpper}${randomLower}${randomNumbers}!`;

        // Update user password and metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: tempPassword,
          user_metadata: {
            ...user.user_metadata,
            temp_password: true,
            credential_regenerated: true,
            credential_regenerated_at: new Date().toISOString()
          }
        });

        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError);
          results.push({ email: user.email, status: 'failed', error: updateError.message });
          continue;
        }

        // Get trainer name for this user
        const { data: rep } = await supabaseAdmin
          .from('reps')
          .select('trainer_id')
          .eq('user_id', user.id)
          .single();

        const trainerName = rep?.trainer_id ? trainerMap.get(rep.trainer_id) || 'Unknown' : 'Unknown';

        credentials.push({
          fullName: user.user_metadata?.full_name || user.email,
          email: user.email,
          tempPassword,
          trainerName
        });

        results.push({ email: user.email, status: 'success' });

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.push({ email: user.email, status: 'failed', error: error.message });
      }
    }

    console.log(`Credential regeneration completed. ${results.filter(r => r.status === 'success').length} successful, ${results.filter(r => r.status === 'failed').length} failed`);

    return new Response(JSON.stringify({
      message: 'Credential regeneration completed',
      summary: {
        total: migratedUsers.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      },
      results,
      credentials
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Credential regeneration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrateRepsRequest {
  csvData: string;
  skipEzText?: boolean;
}

interface RepData {
  fullName: string;
  email: string;
  phone: string;
  trainerName: string;
  birthday: string | null;
  dateAdded: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current user and verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      throw new Error('Only administrators can migrate reps');
    }

    const { csvData, skipEzText = true }: MigrateRepsRequest = await req.json();

    // Trainer name mapping based on database
    const trainerMapping: Record<string, string> = {
      'Adele Martin': '35e4f2b2-981c-4a07-a4c9-e2e09c02ff77',
      'Christina Yeager': '00047c56-4cae-4a60-b913-a25e83a97556',
      'Debbie Goldsberry': '58982a2e-e538-445e-b593-a70f91c5b7ff',
      'Jamie Bonnin': '35dc233f-3d6c-45d6-9efe-e25ee3e75f6f',
      'Jeffrey Feldhusen': '26a7a2a5-fcf4-4b57-9749-1a47d71d3b26',
      'Jennifer Stylinski': 'bdbf7c5a-eb77-416e-b1d0-530ce19d7ad3',
      'Kathy Seehafer': 'dd87a37b-4181-4c82-b603-09487686665a',
      'Natalie Nell': 'e95b5576-fe70-4b74-ba6b-69904a25bcea',
      'Ruth Sattler': '4c426ee6-6dc5-4e86-b22f-be298648bc06'
    };

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const reps: RepData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const rep: RepData = {
        fullName: values[0]?.trim() || '',
        email: values[1]?.trim() || '',
        phone: values[2]?.trim().replace(/\D/g, '') || '', // Remove non-digits
        trainerName: values[3]?.trim() || '',
        birthday: values[4]?.trim() || null,
        dateAdded: values[5]?.trim() || ''
      };

      // Fix Julie Regan's invalid birthday
      if (rep.fullName === 'Julie Regan' && rep.birthday === '10-24-1072') {
        rep.birthday = '10/24/1972'; // Assuming 1972 instead of 1072
      }

      // Convert birthday format from M/D/YYYY to YYYY-MM-DD
      if (rep.birthday && rep.birthday.includes('/')) {
        const [month, day, year] = rep.birthday.split('/');
        rep.birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Convert date added format
      if (rep.dateAdded && rep.dateAdded.includes('/')) {
        const [month, day, year] = rep.dateAdded.split('/');
        rep.dateAdded = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      reps.push(rep);
    }

    console.log(`Processing ${reps.length} reps for migration`);

    const results = [];
    const credentials = [];

    for (const rep of reps) {
      try {
        // Generate temporary password
        const tempPassword = `TempPass${Math.random().toString(36).substring(2, 8)}!`;
        
        // Get trainer ID
        const trainerId = trainerMapping[rep.trainerName];
        if (!trainerId) {
          throw new Error(`Trainer not found: ${rep.trainerName}`);
        }

        // Create user account
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: rep.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: rep.fullName,
            is_migrated: true,
            temp_password: true
          }
        });

        if (createUserError) {
          console.error(`Failed to create user for ${rep.email}:`, createUserError);
          results.push({ email: rep.email, status: 'failed', error: createUserError.message });
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: newUser.user!.id,
            full_name: rep.fullName,
            role: 'REP',
            trainer_id: trainerId
          });

        if (profileError) {
          console.error(`Failed to create profile for ${rep.email}:`, profileError);
          results.push({ email: rep.email, status: 'failed', error: profileError.message });
          continue;
        }

        // Create/update rep record
        const { error: repError } = await supabaseAdmin
          .from('reps')
          .insert({
            user_id: newUser.user!.id,
            full_name: rep.fullName,
            email: rep.email,
            phone: rep.phone,
            trainer_id: trainerId,
            birthday: rep.birthday,
            milestone: 1,
            status: 'Active',
            overall_progress: 0,
            join_date: rep.dateAdded || new Date().toISOString(),
            last_activity: new Date().toISOString()
          });

        if (repError) {
          console.error(`Failed to create rep record for ${rep.email}:`, repError);
          results.push({ email: rep.email, status: 'failed', error: repError.message });
          continue;
        }

        // Store credentials for output
        credentials.push({
          fullName: rep.fullName,
          email: rep.email,
          tempPassword: tempPassword,
          trainerName: rep.trainerName
        });

        results.push({ 
          email: rep.email, 
          status: 'success',
          userId: newUser.user!.id
        });

        console.log(`Successfully migrated: ${rep.email}`);

      } catch (error: any) {
        console.error(`Failed to migrate ${rep.email}:`, error);
        results.push({ 
          email: rep.email, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    console.log(`Migration complete: ${successCount} successful, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Migration complete: ${successCount} successful, ${failCount} failed`,
      results,
      credentials,
      summary: {
        total: reps.length,
        successful: successCount,
        failed: failCount
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
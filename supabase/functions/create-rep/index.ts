import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateRepRequest {
  name: string
  email: string
  phone: string
  birthday?: string
  password: string
  trainerId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for user operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the requesting user is authorized (Admin or Trainer)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Unable to verify user permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Only admins and trainers can create reps
    if (profile.role !== 'ADMIN' && profile.role !== 'TRAINER') {
      console.error('Insufficient permissions. User role:', profile.role)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Parse request body
    const { name, email, phone, birthday, password, trainerId }: CreateRepRequest = await req.json()

    // Validate required fields
    if (!name || !email || !phone || !password || !trainerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, phone, password, trainerId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate phone format (now required)
    const phoneRegex = /^[\+]?[1]?[\s]?[\(]?[0-9]{3}[\)]?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Please use format: (555) 123-4567' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate trainer exists and user has permission to assign to this trainer
    if (profile.role === 'TRAINER' && trainerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Trainers can only assign reps to themselves' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verify trainer exists
    const { data: trainer, error: trainerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', trainerId)
      .eq('role', 'TRAINER')
      .single()

    if (trainerError || !trainer) {
      return new Response(
        JSON.stringify({ error: 'Invalid trainer ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Creating user with email:', email)

    // Create user account using admin client
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email to avoid email verification in demo
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('User created successfully:', newUser.user.id)

    // Create profile with REP role and trainer assignment
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: name,
        role: 'REP',
        trainer_id: trainerId
      })

    if (profileInsertError) {
      console.error('Error creating profile:', profileInsertError)
      // Clean up user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Profile created successfully')

    // Update rep record with additional details (the trigger should have created the basic rep record)
    const { data: repData, error: repUpdateError } = await supabaseAdmin
      .from('reps')
      .update({
        phone: phone || null,
        birthday: birthday || null,
        email: email // Ensure email is properly set
      })
      .eq('user_id', newUser.user.id)
      .select()
      .single()

    if (repUpdateError) {
      console.error('Error updating rep record:', repUpdateError)
    }

    console.log('Rep record updated successfully')

    // Create contact in EZ Text - use the original JWT token from the request
    try {
      const ezTextResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/eztext-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization')! // Pass through the original JWT token
        },
        body: JSON.stringify({
          name: name,
          phone: phone,
          email: email,
          birthday: birthday
        })
      });

      if (!ezTextResponse.ok) {
        console.error('EZ Text integration failed:', await ezTextResponse.text());
      } else {
        console.log('EZ Text contact created successfully');
      }
    } catch (ezTextError) {
      console.error('Error calling EZ Text integration:', ezTextError);
    }

    // Return the created rep data
    const { data: finalRep, error: repFetchError } = await supabase
      .from('reps')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single()

    if (repFetchError) {
      console.error('Error fetching final rep data:', repFetchError)
      return new Response(
        JSON.stringify({ error: 'Rep created but failed to fetch data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rep: finalRep,
        message: 'Rep created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Only administrators can delete users' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the target user ID from request body
    const { target_user_id } = await req.json()
    
    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Don't allow deleting yourself
    if (target_user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${user.email} deleting user ${target_user_id}`)

    // First, delete from application tables using the existing function
    const { error: dbError } = await supabaseAdmin.rpc('delete_user_completely', {
      target_user_id: target_user_id
    })

    if (dbError) {
      console.error('Database deletion failed:', dbError)
      return new Response(
        JSON.stringify({ error: `Database deletion failed: ${dbError.message}` }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Then, delete from Supabase Auth using admin API
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id)
    
    if (authDeleteError) {
      console.error('Auth deletion failed:', authDeleteError)
      // Log the error but don't fail the request since DB cleanup succeeded
      console.log('User was deleted from database but auth deletion failed. This may cause signup issues.')
    } else {
      console.log(`User ${target_user_id} completely deleted from both database and auth`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        auth_deleted: !authDeleteError 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
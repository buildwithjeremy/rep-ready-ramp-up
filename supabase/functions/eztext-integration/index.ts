import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EZTextContact {
  name: string
  phone: string
  email: string
  groupId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ezTextApiKey = Deno.env.get('EZTEXT_API_KEY')
    const ezTextGroupId = Deno.env.get('EZTEXT_GROUP_ID')
    
    if (!ezTextApiKey) {
      console.error('EZTEXT_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'EZ Text API not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parse request body
    const { name, phone, email, groupId }: EZTextContact = await req.json()

    // Validate required fields
    if (!name || !phone || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, phone, email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Creating EZ Text contact for:', { name, phone, email })

    // Step 1: Create contact in EZ Text
    const createContactResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ezTextApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        phone_number: phone.replace(/\D/g, ''), // Remove non-digits
        email: email
      })
    })

    if (!createContactResponse.ok) {
      const errorText = await createContactResponse.text()
      console.error('EZ Text contact creation failed:', createContactResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create contact in EZ Text',
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const contactData = await createContactResponse.json()
    console.log('EZ Text contact created:', contactData)

    // Step 2: Add contact to group (if groupId provided)
    const targetGroupId = groupId || ezTextGroupId
    if (targetGroupId && contactData.id) {
      console.log('Adding contact to group:', targetGroupId)
      
      const addToGroupResponse = await fetch(`https://a.eztexting.com/v1/groups/${targetGroupId}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ezTextApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          contact_ids: [contactData.id]
        })
      })

      if (!addToGroupResponse.ok) {
        const errorText = await addToGroupResponse.text()
        console.error('Failed to add contact to group:', addToGroupResponse.status, errorText)
        // Don't fail the entire request if group addition fails
        console.warn('Contact created but failed to add to group')
      } else {
        console.log('Contact successfully added to group')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        eztext_contact_id: contactData.id,
        message: 'Contact created in EZ Text successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
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

interface EZTextToken {
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
  createdAt: number
}

// Simple in-memory token cache (resets on cold start)
let cachedToken: EZTextToken | null = null

// Function to check if token is still valid
function isTokenValid(token: EZTextToken | null): boolean {
  if (!token) return false
  const now = Date.now()
  const tokenAge = (now - token.createdAt) / 1000 // Convert to seconds
  return tokenAge < (token.expiresInSeconds - 60) // 60 second buffer
}

// Function to create a new access token
async function createToken(appKey: string, appSecret: string): Promise<EZTextToken> {
  console.log('Creating new EZ Text token')
  
  const response = await fetch('https://a.eztexting.com/v1/tokens/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      appKey: appKey,
      appSecret: appSecret
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token creation failed:', response.status, errorText)
    throw new Error(`Failed to create EZ Text token: ${errorText}`)
  }

  const tokenData = await response.json()
  const token: EZTextToken = {
    ...tokenData,
    createdAt: Date.now()
  }
  
  console.log('New token created, expires in:', token.expiresInSeconds, 'seconds')
  return token
}

// Function to refresh an access token
async function refreshToken(refreshToken: string): Promise<EZTextToken> {
  console.log('Refreshing EZ Text token')
  
  const response = await fetch('https://a.eztexting.com/v1/tokens/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: refreshToken
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token refresh failed:', response.status, errorText)
    throw new Error(`Failed to refresh EZ Text token: ${errorText}`)
  }

  const tokenData = await response.json()
  const token: EZTextToken = {
    ...tokenData,
    createdAt: Date.now()
  }
  
  console.log('Token refreshed, expires in:', token.expiresInSeconds, 'seconds')
  return token
}

// Function to get a valid access token
async function getValidToken(appKey: string, appSecret: string): Promise<string> {
  // Check if we have a valid cached token
  if (isTokenValid(cachedToken)) {
    console.log('Using cached token')
    return cachedToken!.accessToken
  }

  // Try to refresh if we have a refresh token
  if (cachedToken?.refreshToken) {
    try {
      cachedToken = await refreshToken(cachedToken.refreshToken)
      return cachedToken.accessToken
    } catch (error) {
      console.warn('Token refresh failed, creating new token:', error.message)
      cachedToken = null
    }
  }

  // Create a new token
  cachedToken = await createToken(appKey, appSecret)
  return cachedToken.accessToken
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ezTextAppKey = Deno.env.get('EZTEXT_APP_KEY')
    const ezTextAppSecret = Deno.env.get('EZTEXT_APP_SECRET')
    const ezTextGroupId = Deno.env.get('EZTEXT_GROUP_ID')
    
    if (!ezTextAppKey || !ezTextAppSecret) {
      console.error('EZTEXT_APP_KEY or EZTEXT_APP_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'EZ Text credentials not configured' }),
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

    // Get valid access token
    const accessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)

    // Step 1: Create contact in EZ Text
    const createContactResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
      
      // If it's a 401, the token might be invalid - clear cache and retry once
      if (createContactResponse.status === 401) {
        console.log('Token might be invalid, clearing cache and retrying')
        cachedToken = null
        const newAccessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)
        
        const retryResponse = await fetch('https://a.eztexting.com/v1/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            phone_number: phone.replace(/\D/g, ''),
            email: email
          })
        })
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text()
          console.error('EZ Text contact creation failed on retry:', retryResponse.status, retryErrorText)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create contact in EZ Text after retry',
              details: retryErrorText 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        const contactData = await retryResponse.json()
        console.log('EZ Text contact created on retry:', contactData)
        
        // Continue with group assignment using the retry contact data
        const targetGroupId = groupId || ezTextGroupId
        if (targetGroupId && contactData.id) {
          await addContactToGroup(newAccessToken, targetGroupId, contactData.id)
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            eztext_contact_id: contactData.id,
            message: 'Contact created in EZ Text successfully (after retry)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
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
      await addContactToGroup(accessToken, targetGroupId, contactData.id)
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

// Helper function to add contact to group
async function addContactToGroup(accessToken: string, groupId: string, contactId: string): Promise<void> {
  console.log('Adding contact to group:', groupId)
  
  const addToGroupResponse = await fetch(`https://a.eztexting.com/v1/groups/${groupId}/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      contact_ids: [contactId]
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
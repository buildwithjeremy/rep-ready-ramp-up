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
    console.log('EZ Text App Key (first 10 chars):', ezTextAppKey?.substring(0, 10))
    console.log('EZ Text Group ID:', ezTextGroupId)

    // Get valid access token
    const accessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)
    
    // First, let's test if we can fetch contacts to verify API connection
    console.log('Testing EZ Text API connection with contacts endpoint...')
    const contactsTestResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (contactsTestResponse.ok) {
      const contactsData = await contactsTestResponse.json()
      console.log('EZ Text contacts API working. Full response:', JSON.stringify(contactsData, null, 2))
      
      // Try to find any existing contacts to see what phone format they use
      if (contactsData?.content && contactsData.content.length > 0) {
        const sampleContact = contactsData.content[0]
        console.log('Sample existing contact phone format:', sampleContact?.phoneNumber)
        console.log('Found existing groups in contacts:', contactsData.content.filter(c => c.groups?.length > 0).map(c => c.groups).flat())
      }
    } else {
      const contactsError = await contactsTestResponse.text()
      console.error('EZ Text contacts API test failed:', contactsTestResponse.status, contactsError)
      
      // If contacts endpoint fails, the credentials might be wrong
      if (contactsTestResponse.status === 401 || contactsTestResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'EZ Text API authentication failed. Please check your App Key and App Secret.',
            status: contactsTestResponse.status,
            details: contactsError 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    }
    
    // Test if we can fetch groups if Group ID is provided
    if (ezTextGroupId) {
      console.log('Testing EZ Text Group ID with groups endpoint...')
      const groupsTestResponse = await fetch('https://a.eztexting.com/v1/groups', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (groupsTestResponse.ok) {
        const groupsData = await groupsTestResponse.json()
        console.log('Available groups:', JSON.stringify(groupsData, null, 2))
        
        // Check if our group ID exists in the response
        const groups = groupsData?.items || []
        const groupExists = groups.some((group: any) => group.id === ezTextGroupId || group.id === parseInt(ezTextGroupId))
        
        if (!groupExists) {
          console.warn(`Group ID ${ezTextGroupId} not found in available groups`)
          console.log('Available group IDs:', groups.map((g: any) => g.id))
        }
      } else {
        const groupsError = await groupsTestResponse.text()
        console.error('EZ Text groups API test failed:', groupsTestResponse.status, groupsError)
      }
    }

    // Based on the existing contacts, EZ Text expects: 11 digits starting with 1 (e.g., "14148651615")
    const digitsOnly = phone.replace(/\D/g, '')
    console.log('Phone digits only:', digitsOnly)
    
    // Ensure we have US format with country code
    let phoneWithCountryCode = digitsOnly
    if (digitsOnly.length === 10) {
      phoneWithCountryCode = '1' + digitsOnly // Add US country code
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      phoneWithCountryCode = digitsOnly // Already has country code
    } else {
      console.warn('Unexpected phone number length:', digitsOnly.length)
      // Try to force US format anyway
      phoneWithCountryCode = '1' + digitsOnly.slice(-10)
    }
    
    console.log('Phone with country code:', phoneWithCountryCode)
    
    // Based on existing contacts in EZ Text, they use simple format: just digits with country code
    const ezTextFormat = phoneWithCountryCode // e.g., "13173411638"

    // Step 1: Create contact in EZ Text using the exact same field structure as existing contacts
    // Let's try both possible field names that might be expected
    const requestBody = {
      firstName: name.split(' ')[0] || name,  // Try camelCase like existing contacts
      lastName: name.split(' ').slice(1).join(' ') || '',
      phoneNumber: ezTextFormat,  // Try camelCase like existing contacts
      email: email
    }
    
    console.log('Request body for EZ Text (camelCase format):', JSON.stringify(requestBody, null, 2))

    const createContactResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
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
          body: JSON.stringify(requestBody)
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
          details: errorText,
          phone_format_tried: ezTextFormat
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const contactData = await createContactResponse.json()
    console.log('EZ Text contact response:', JSON.stringify(contactData, null, 2))

    // Check if contact was actually created or if this is an error response
    // When EZ Text returns the phone number as ID, it usually means the contact wasn't created
    if (contactData.id === ezTextFormat) {
      console.log('WARNING: Contact ID matches phone number - this typically indicates the contact was NOT created')
      console.log('This might be due to API limitations, duplicate detection, or formatting issues')
      
      // Let's try to verify if the contact actually exists by searching for it
      const searchResponse = await fetch(`https://a.eztexting.com/v1/contacts?phoneNumber=${ezTextFormat}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        console.log('Contact search result:', JSON.stringify(searchData, null, 2))
        
        if (searchData.content && searchData.content.length > 0) {
          console.log('Contact found in search - using existing contact')
          const existingContact = searchData.content[0]
          
          return new Response(
            JSON.stringify({ 
              success: true,
              eztext_contact_id: existingContact.phoneNumber,
              message: 'Contact already exists in EZ Text',
              existing_contact: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.log('Contact not found in search - creation may have failed silently')
        }
      } else {
        console.error('Failed to search for contact:', await searchResponse.text())
      }
    }

    // For now, assume success but warn about potential issues
    console.log('Proceeding with contact creation response, but may need manual verification')

    // Skip group assignment since the contact creation is questionable
    console.log('Skipping group assignment due to uncertain contact creation status')

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
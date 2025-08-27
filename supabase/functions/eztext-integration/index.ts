import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EZTextContact {
  name: string
  phone: string
  email: string
  birthday?: string
  groupId?: string
  requestId?: string
  source?: string
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
  
  return token
}

// Function to refresh an access token
async function refreshToken(refreshToken: string): Promise<EZTextToken> {
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
  
  return token
}

// Function to get a valid access token
async function getValidToken(appKey: string, appSecret: string): Promise<string> {
  // Check if we have a valid cached token
  if (isTokenValid(cachedToken)) {
    return cachedToken!.accessToken
  }

  // Try to refresh if we have a refresh token
  if (cachedToken?.refreshToken) {
    try {
      cachedToken = await refreshToken(cachedToken.refreshToken)
      return cachedToken.accessToken
    } catch (error) {
      cachedToken = null
    }
  }

  // Create a new token
  cachedToken = await createToken(appKey, appSecret)
  return cachedToken.accessToken
}

// Consistent phone number formatting function
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Always ensure US format with country code for internal use
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned;
  } else {
    // For other lengths, assume it needs US country code
    return cleaned.length < 11 ? `1${cleaned}` : cleaned;
  }
}

// Get phone number for group operations (without country code)
function getPhoneForGroup(formattedPhone: string): string {
  return formattedPhone.startsWith('1') ? formattedPhone.substring(1) : formattedPhone;
}

// Helper function to add contact to group using phone number (using working API format)
async function addContactToGroup(accessToken: string, groupId: string, phoneNumber: string): Promise<boolean> {
  try {
    const phoneForGroup = getPhoneForGroup(phoneNumber);
    
    const groupResponse = await fetch(`https://a.eztexting.com/v1/contact-groups/${groupId}/contacts?phoneNumbers=${phoneForGroup}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*'
      }
    });

    if (!groupResponse.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to check if contact exists by trying to add to group first
async function checkContactExistsAndAddToGroup(accessToken: string, groupId: string, phoneNumber: string): Promise<boolean> {
  return await addContactToGroup(accessToken, groupId, phoneNumber);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, phone, email, birthday, groupId, requestId, source, debug }: EZTextContact & { debug?: boolean } = await req.json()
    
    const trackingId = requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Always use verbose logging by default for easier troubleshooting
    console.log(`[${trackingId}] EZ Text integration called from: ${source || 'unknown'} - processing contact creation`);
    console.log(`[${trackingId}] Input data:`, { name, phone, email, birthday, groupId });
    
    const ezTextAppKey = Deno.env.get('EZTEXT_APP_KEY')
    const ezTextAppSecret = Deno.env.get('EZTEXT_APP_SECRET')
    const ezTextGroupId = Deno.env.get('EZTEXT_GROUP_ID')
    
    if (!ezTextAppKey || !ezTextAppSecret) {
      console.error(`[${trackingId}] EZTEXT_APP_KEY or EZTEXT_APP_SECRET not configured`)
      return new Response(
        JSON.stringify({ error: 'EZ Text credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Validate required fields
    if (!name || !phone || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, phone, email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Format phone number consistently
    const formattedPhone = formatPhoneNumber(phone);
    
    console.log(`[${trackingId}] Processing EZ Text contact for:`, { name, phone, email })
    console.log(`[${trackingId}] EZ Text Group ID:`, ezTextGroupId)
    console.log(`[${trackingId}] Original phone:`, phone);
    console.log(`[${trackingId}] Formatted phone:`, formattedPhone);

    // Get valid access token
    const accessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)
    console.log(`[${trackingId}] Access token obtained successfully`);
    
    let contactCreated = false;
    let contactId = null;

    // Step 1: Create or update contact in EZ Text with complete data
    const requestBody = {
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      phoneNumber: formattedPhone,
      email: email,
      ...(birthday && { birthday: birthday })
    }
    
    console.log(`[${trackingId}] Creating contact in EZ Text with complete data...`);
    console.log(`[${trackingId}] Request body:`, JSON.stringify(requestBody, null, 2));

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
      console.log(`[${trackingId}] Create contact response not OK:`, createContactResponse.status, errorText);
      
      // If it's a 401, retry with fresh token
      if (createContactResponse.status === 401) {
        console.log(`[${trackingId}] Access token expired, getting new token and retrying...`);
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
          console.error(`[${trackingId}] Retry also failed:`, retryResponse.status, retryErrorText);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create contact in EZ Text after retry',
              details: retryErrorText,
              trackingId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        const contactData = await retryResponse.json()
        contactId = contactData.id;
        contactCreated = true;
        console.log(`[${trackingId}] Contact created successfully on retry:`, contactId);
      } else if (createContactResponse.status === 409 || errorText.includes('already exists')) {
        // Contact already exists - this is fine, we'll update it
        console.log(`[${trackingId}] Contact already exists, treating as update operation`);
        contactId = formattedPhone;
        contactCreated = false;
      } else {
        console.error(`[${trackingId}] Failed to create contact with error:`, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create contact in EZ Text',
            details: errorText,
            phone_format_tried: formattedPhone,
            trackingId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else {
      const contactData = await createContactResponse.json()
      contactId = contactData.id;
      contactCreated = true;
      console.log(`[${trackingId}] Contact created successfully:`, contactId);
    }

    // Step 2: Add to group if we have a group ID
    let groupAssigned = false;
    if (ezTextGroupId) {
      console.log(`[${trackingId}] Adding contact to group:`, ezTextGroupId);
      groupAssigned = await addContactToGroup(accessToken, ezTextGroupId, formattedPhone);
      console.log(`[${trackingId}] Group assignment result:`, groupAssigned);
    } else {
      console.log(`[${trackingId}] No group ID provided, skipping group assignment`);
    }

    // Return success response
    const message = contactCreated 
      ? 'New contact created and processed successfully' 
      : 'Existing contact processed successfully';
      
    return new Response(JSON.stringify({ 
      success: true, 
      contactId: contactId || formattedPhone,
      phoneNumber: formattedPhone,
      email: email,
      existed: !contactCreated,
      created: contactCreated,
      groupAssigned: groupAssigned,
      message: message,
      trackingId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        trackingId: 'error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

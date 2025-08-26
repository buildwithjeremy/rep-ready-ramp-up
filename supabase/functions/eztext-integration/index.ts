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
    console.log(`Attempting to add contact ${phoneForGroup} to group ${groupId}`);
    
    const groupResponse = await fetch(`https://a.eztexting.com/v1/contact-groups/${groupId}/contacts?phoneNumbers=${phoneForGroup}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*'
      }
    });

    if (!groupResponse.ok) {
      const errorText = await groupResponse.text();
      console.error(`Failed to add contact to group: ${groupResponse.status} ${errorText}`);
      return false;
    }

    const groupResult = await groupResponse.json();
    console.log(`Successfully added contact ${phoneForGroup} to group ${groupId}:`, groupResult);
    return true;
  } catch (error) {
    console.error('Error adding contact to group:', error);
    return false;
  }
}

// Helper function to check if contact exists by trying to add to group first
async function checkContactExistsAndAddToGroup(accessToken: string, groupId: string, phoneNumber: string): Promise<boolean> {
  console.log('Checking if contact exists by attempting group assignment...');
  return await addContactToGroup(accessToken, groupId, phoneNumber);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, phone, email, birthday, groupId, requestId, source }: EZTextContact = await req.json()
    
    const trackingId = requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${trackingId}] EZ Text integration called from: ${source || 'unknown'} - processing contact creation`);
    
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

    console.log(`[${trackingId}] Processing EZ Text contact for:`, { name, phone, email })
    console.log(`[${trackingId}] EZ Text Group ID:`, ezTextGroupId)

    // Format phone number consistently
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`[${trackingId}] Original phone:`, phone);
    console.log(`[${trackingId}] Formatted phone:`, formattedPhone);

    // Get valid access token
    const accessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)
    
    let contactExistsInGroup = false;
    let contactCreated = false;
    
    // Step 1: If group ID is provided, try to add contact to group first (this is idempotent)
    if (ezTextGroupId) {
      console.log(`[${trackingId}] Attempting to add existing contact to group first...`);
      contactExistsInGroup = await checkContactExistsAndAddToGroup(accessToken, ezTextGroupId, formattedPhone);
      
      if (contactExistsInGroup) {
        console.log(`[${trackingId}] ✅ Contact already exists and was added to group successfully`);
        return new Response(JSON.stringify({ 
          success: true, 
          contactId: formattedPhone,
          phoneNumber: formattedPhone,
          email: email,
          existed: true,
          groupAssigned: true,
          message: 'Existing contact added to group successfully',
          trackingId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`[${trackingId}] Contact not found or couldn't be added to group - will create new contact`);
      }
    }

    // Step 2: Create contact in EZ Text
    console.log(`[${trackingId}] Creating new contact in EZ Text...`);
    const requestBody = {
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      phoneNumber: formattedPhone,
      email: email,
      ...(birthday && { birthday: birthday })
    }
    
    console.log(`[${trackingId}] Request body for EZ Text:`, JSON.stringify(requestBody, null, 2))

    const createContactResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    let contactId = null;
    
    if (!createContactResponse.ok) {
      const errorText = await createContactResponse.text()
      console.error(`[${trackingId}] EZ Text contact creation failed:`, createContactResponse.status, errorText)
      
      // If it's a 401, retry with fresh token
      if (createContactResponse.status === 401) {
        console.log(`[${trackingId}] Token might be invalid, clearing cache and retrying`)
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
          console.error(`[${trackingId}] EZ Text contact creation failed on retry:`, retryResponse.status, retryErrorText)
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
        console.log(`[${trackingId}] EZ Text contact created on retry:`, contactData)
      } else if (createContactResponse.status === 409 || errorText.includes('already exists')) {
        // Contact already exists - this is fine, we can proceed with group assignment
        console.log(`[${trackingId}] Contact already exists in EZ Text - proceeding with group assignment`)
        contactId = formattedPhone;
        contactCreated = false;
      } else {
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
      console.log(`[${trackingId}] EZ Text contact response:`, JSON.stringify(contactData, null, 2))
    }

    // Step 3: Add to group if we have a group ID and haven't already done so
    let groupAssigned = contactExistsInGroup;
    if (ezTextGroupId && !contactExistsInGroup) {
      console.log(`[${trackingId}] Adding ${contactCreated ? 'newly created' : 'existing'} contact to group...`);
      groupAssigned = await addContactToGroup(accessToken, ezTextGroupId, formattedPhone);
      
      if (groupAssigned) {
        console.log(`[${trackingId}] ✅ Successfully added contact to group`);
      } else {
        console.log(`[${trackingId}] ⚠️ Failed to add contact to group, but contact exists`);
      }
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

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

// Improved phone number formatting function
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleaned.length === 10) {
    // US phone number without country code
    return `1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US phone number with country code
    return cleaned;
  } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
    // International number, keep as is
    return cleaned;
  } else {
    // For other lengths, assume it needs US country code if < 11 digits
    return cleaned.length < 11 ? `1${cleaned}` : cleaned;
  }
}

// Helper function to add contact to group using phone number (using working API format)
async function addContactToGroup(accessToken: string, groupId: string, phoneNumber: string): Promise<void> {
  try {
    // Use query parameter format as per working example - remove country code for the API call
    const phoneForGroup = phoneNumber.startsWith('1') ? phoneNumber.substring(1) : phoneNumber;
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
      throw new Error(`Failed to add contact ${phoneForGroup} to group ${groupId}: ${groupResponse.status}`);
    }

    const groupResult = await groupResponse.json();
    console.log(`Successfully added contact ${phoneForGroup} to group ${groupId}:`, groupResult);
  } catch (error) {
    console.error('Error adding contact to group:', error);
    throw error;
  }
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
    const { name, phone, email, birthday, groupId }: EZTextContact = await req.json()

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

    // Format phone number consistently
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Original phone:', phone);
    console.log('Formatted phone:', formattedPhone);

    // Get valid access token
    const accessToken = await getValidToken(ezTextAppKey, ezTextAppSecret)
    
    // Test API connection
    console.log('Testing EZ Text API connection with contacts endpoint...')
    const contactsTestResponse = await fetch('https://a.eztexting.com/v1/contacts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!contactsTestResponse.ok) {
      const contactsError = await contactsTestResponse.text()
      console.error('EZ Text contacts API test failed:', contactsTestResponse.status, contactsError)
      
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

    // Create contact in EZ Text
    const requestBody = {
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      phoneNumber: formattedPhone,
      email: email,
      ...(birthday && { birthday: birthday }) // Add birthday as custom field if provided
    }
    
    console.log('Request body for EZ Text:', JSON.stringify(requestBody, null, 2))

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
        contactId = contactData.id;
        console.log('EZ Text contact created on retry:', contactData)
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create contact in EZ Text',
            details: errorText,
            phone_format_tried: formattedPhone
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else {
      const contactData = await createContactResponse.json()
      contactId = contactData.id;
      console.log('EZ Text contact response:', JSON.stringify(contactData, null, 2))
    }

    // Search for the contact to verify creation and get proper contact data
    let contactFound = false;
    let actualContactId = contactId;
    
    try {
      // Search through multiple pages to find our contact
      let pageNumber = 0;
      const maxPages = 5; // Limit search to avoid infinite loops
      
      while (!contactFound && pageNumber < maxPages) {
        const verifyResponse = await fetch(`https://a.eztexting.com/v1/contacts?size=100&page=${pageNumber}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log(`Searching page ${pageNumber} for phone number: ${formattedPhone}`);
          
          // Search through contacts to find our newly created contact
          const foundContact = verifyData.content?.find((contact: any) => 
            contact.phoneNumber === formattedPhone ||
            contact.email === email
          );
          
          if (foundContact) {
            contactFound = true;
            actualContactId = foundContact.phoneNumber; // EZ Text uses phone as identifier
            console.log('✅ Contact found in verification search - creation successful!');
            console.log('Contact details:', {
              id: foundContact.id || 'N/A',
              phoneNumber: foundContact.phoneNumber,
              email: foundContact.email,
              firstName: foundContact.firstName,
              lastName: foundContact.lastName
            });
            break;
          }
        }
        pageNumber++;
      }
      
      if (!contactFound) {
        console.log('Contact NOT found in verification search across multiple pages');
      }
    } catch (error) {
      console.error('Error during contact verification:', error);
    }

    // Add to group - always attempt if group ID is provided since contact creation succeeded
    if (ezTextGroupId) {
      try {
        console.log(`Attempting to add contact ${formattedPhone} to group ${ezTextGroupId}`);
        await addContactToGroup(accessToken, ezTextGroupId, formattedPhone);
        console.log('✅ Successfully added contact to group');
      } catch (groupError) {
        console.error('Failed to add contact to group, but contact was created successfully:', groupError);
        // Don't throw here - contact creation was successful, group assignment failed
      }
    }

    // Return detailed response
    return new Response(JSON.stringify({ 
      success: true, 
      contactId: actualContactId,
      phoneNumber: formattedPhone,
      email: email,
      verified: contactFound,
      groupAssigned: ezTextGroupId && contactFound,
      message: contactFound ? 'Contact created and verified successfully' : 'Contact created but verification uncertain'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

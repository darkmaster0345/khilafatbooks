// CSRF Token Validation Edge Function
// Validates CSRF tokens for state-changing operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const CSRF_COOKIE_NAME = 'csrf_token';
    const CSRF_HEADER_NAME = 'x-csrf-token';

    // Get token from cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    const cookieToken = cookieMatch ? cookieMatch[1] : null;

    // Get token from header
    const headerToken = req.headers.get(CSRF_HEADER_NAME);

    // Validate tokens exist and match
    if (!cookieToken || !headerToken) {
      return new Response(
        JSON.stringify({ 
          error: 'CSRF token missing',
          details: !cookieToken ? 'Cookie token missing' : 'Header token missing'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (cookieToken !== headerToken) {
      return new Response(
        JSON.stringify({ error: 'CSRF token mismatch' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Token is valid
    return new Response(
      JSON.stringify({ valid: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('CSRF validation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

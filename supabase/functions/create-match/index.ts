import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type InterestRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
};

type MatchRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'Supabase function environment is not configured correctly.' }, 500);
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header.' }, 401);
  }

  const accessToken = authorizationHeader.replace('Bearer ', '').trim();
  if (!accessToken) {
    return jsonResponse({ error: 'Missing access token.' }, 401);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(accessToken);

  if (authError || !user) {
    return jsonResponse({ error: 'Authentication required.' }, 401);
  }

  let interestRequestId = '';

  try {
    const body = await request.json();
    interestRequestId =
      typeof body?.interestRequestId === 'string' ? body.interestRequestId.trim() : '';
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (!interestRequestId) {
    return jsonResponse({ error: 'interestRequestId is required.' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: interestRequest, error: interestRequestError } = await serviceClient
    .from('interest_requests')
    .select('id, from_user_id, to_user_id, status')
    .eq('id', interestRequestId)
    .maybeSingle();

  if (interestRequestError) {
    console.error('[create-match] interest request lookup failed', interestRequestError);
    return jsonResponse({ error: 'Unable to load the interest request.' }, 500);
  }

  if (!interestRequest) {
    return jsonResponse({ error: 'Interest request not found.' }, 404);
  }

  if (interestRequest.to_user_id !== user.id) {
    return jsonResponse(
      { error: 'You can only create a match from an interest request sent to you.' },
      403,
    );
  }

  if (interestRequest.status !== 'accepted') {
    return jsonResponse({ error: 'Only accepted interest requests can create matches.' }, 400);
  }

  if (interestRequest.from_user_id === interestRequest.to_user_id) {
    return jsonResponse({ error: 'A match requires two different users.' }, 400);
  }

  const [user1_id, user2_id] = [interestRequest.from_user_id, interestRequest.to_user_id].sort();

  const { data: createdMatch, error: createMatchError } = await serviceClient
    .from('matches')
    .insert({ user1_id, user2_id })
    .select('*')
    .single();

  if (createMatchError) {
    if (createMatchError.code === '23505') {
      const { data: existingMatch, error: existingMatchError } = await serviceClient
        .from('matches')
        .select('*')
        .eq('user1_id', user1_id)
        .eq('user2_id', user2_id)
        .maybeSingle();

      if (existingMatchError || !existingMatch) {
        console.error('[create-match] existing match lookup failed', existingMatchError);
        return jsonResponse({ error: 'This match already exists, but it could not be loaded.' }, 409);
      }

      return jsonResponse(existingMatch, 200);
    }

    console.error('[create-match] insert failed', createMatchError);
    return jsonResponse({ error: 'Unable to create the match right now.' }, 500);
  }

  return jsonResponse(createdMatch, 201);
});

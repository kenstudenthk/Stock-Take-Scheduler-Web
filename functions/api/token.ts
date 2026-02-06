/**
 * Cloudflare Pages Function for shared token storage
 * Uses Cloudflare KV to store the token that all users can access
 *
 * Endpoints:
 * - GET /api/token - Retrieve the current token
 * - POST /api/token - Update the token (requires body: { token: string })
 */

interface Env {
  TOKEN_STORE: KVNamespace;
}

const TOKEN_KEY = 'graph_token';
const TOKEN_TIMESTAMP_KEY = 'graph_token_timestamp';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const token = await env.TOKEN_STORE.get(TOKEN_KEY);
    const timestamp = await env.TOKEN_STORE.get(TOKEN_TIMESTAMP_KEY);

    return new Response(JSON.stringify({
      success: true,
      token: token || '',
      timestamp: timestamp ? parseInt(timestamp) : null,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve token',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const body = await request.json() as { token: string };
    const token = body.token?.trim() || '';
    const timestamp = Date.now();

    // Store token and timestamp in KV
    await env.TOKEN_STORE.put(TOKEN_KEY, token);
    await env.TOKEN_STORE.put(TOKEN_TIMESTAMP_KEY, timestamp.toString());

    return new Response(JSON.stringify({
      success: true,
      message: 'Token updated successfully',
      timestamp,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update token',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

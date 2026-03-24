/**
 * stock-take-token-sync Cloudflare Worker
 *
 * Routes:
 *   GET  /              → return stored graph token from KV
 *   POST /              → store graph token to KV
 *   POST /image-proxy   → proxy SharePoint list attachment image
 *                         Requires X-SP-Cookie header: "rtFa=xxx; FedAuth=yyy"
 */

const SPO_SITE = "https://pccw0.sharepoint.com/sites/BonniesTeam";
const LIST_PATH = "Lists/Stock%20Take%20Record%202025/Attachments";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-SP-Cookie",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── POST /image-proxy ────────────────────────────────────────────────────
    if (request.method === "POST" && url.pathname === "/image-proxy") {
      const spCookie = request.headers.get("X-SP-Cookie");
      if (!spCookie) {
        return new Response(JSON.stringify({ error: "Missing X-SP-Cookie header" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { itemId, fileName } = body;
      if (!itemId || !fileName) {
        return new Response(JSON.stringify({ error: "Missing itemId or fileName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encodedFileName = encodeURIComponent(fileName);
      const spoUrl = `${SPO_SITE}/${LIST_PATH}/${itemId}/${encodedFileName}`;

      try {
        const imgRes = await fetch(spoUrl, {
          headers: {
            Cookie: spCookie,
            Accept: "application/octet-stream, image/*",
          },
          redirect: "follow",
        });

        if (!imgRes.ok) {
          const text = await imgRes.text();
          return new Response(
            JSON.stringify({ error: `SharePoint ${imgRes.status}`, detail: text }),
            { status: imgRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const contentType = imgRes.headers.get("Content-Type") || "image/png";
        const imageBytes = await imgRes.arrayBuffer();

        return new Response(imageBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Fetch error", detail: err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── GET / — return stored graph token ────────────────────────────────────
    if (request.method === "GET" && url.pathname === "/") {
      const token = await env.TOKEN_STORE.get("graph_token");
      return new Response(JSON.stringify({ token: token || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST / — store graph token ────────────────────────────────────────────
    if (request.method === "POST" && url.pathname === "/") {
      try {
        const body = await request.json();
        const newToken = body.token;
        if (!newToken) {
          return new Response("Missing token", { status: 400, headers: corsHeaders });
        }
        await env.TOKEN_STORE.put("graph_token", newToken);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response("Error parsing JSON", { status: 400, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};

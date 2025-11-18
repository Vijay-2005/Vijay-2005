// api/streak.js
// Vercel serverless function
export default async function handler(req, res) {
  try {
    // Optional: allow username/theme via query params, fallback to your defaults
    const user = req.query.user || "vijay-2005";
    const theme = req.query.theme || "tokyonight";
    const upstream = `https://streak-stats.demolab.com/?user=${encodeURIComponent(user)}&theme=${encodeURIComponent(theme)}`;

    // Fetch upstream image - use global fetch (Node 18+) or import from node-fetch
    const upstreamResp = await fetch(upstream, { 
      method: "GET", 
      redirect: "follow",
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VercelProxy/1.0)'
      }
    });

    if (!upstreamResp.ok) {
      // If upstream fails, return 502 with a short message (optionally return a small placeholder)
      res.status(502).send("Upstream service unavailable");
      return;
    }

    // Read body as ArrayBuffer and forward
    const buffer = Buffer.from(await upstreamResp.arrayBuffer());

    // Content-Type: use upstream header if present, otherwise default to svg
    const contentType = upstreamResp.headers.get("content-type") || "image/svg+xml";

    // Cache: let Vercel CDN cache for a short period but revalidate occasionally
    // s-maxage controls CDN (edge) caching; max-age controls client caching
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600, max-age=60"); 
      // edge: 5 minutes, clients: 1 minute, allow stale while revalidate

    // Helpful headers
    res.setHeader("X-Proxy-From", "streak-stats.demolab.com");
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Error proxying streak image:", err);
    res.status(500).send("Internal server error");
  }
}

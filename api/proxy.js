export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://fptplay.vn/',
        'Origin': 'https://fptplay.vn'
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const contentType = response.headers.get('content-type') || '';
    if (url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegurl')) {
      let text = await response.text();
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

      // Rewrite relative URLs to absolute CDN URLs
      text = text.replace(/^(?!#)(.+)$/gm, (match) => {
        const trimmed = match.trim();
        if (!trimmed || trimmed.startsWith('#')) return match;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return match;
        try {
          return new URL(trimmed, baseUrl).href;
        } catch (e) {
          return match;
        }
      });

      res.setHeader('Content-Type', 'application/x-mpegurl');
      return res.status(response.status).send(text);
    }

    // For non-m3u8 files
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    const arrayBuffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}

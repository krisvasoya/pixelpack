const robotsParser = require('robots-parser');
const axios = require('axios');

/**
 * Normalize a URL — ensure it has a scheme, trailing slash optional
 */
function normalizeUrl(raw) {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate that the URL is syntactically valid and publicly reachable
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract the origin (scheme + hostname) from a URL
 */
function getOrigin(url) {
  try {
    const { origin } = new URL(url);
    return origin;
  } catch {
    return null;
  }
}

/**
 * Get the hostname (without www.) from a URL
 */
function getBaseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Check whether two URLs share the same hostname
 */
function isSameDomain(urlA, urlB) {
  try {
    const a = new URL(urlA).hostname.replace(/^www\./, '');
    const b = new URL(urlB).hostname.replace(/^www\./, '');
    return a === b;
  } catch {
    return false;
  }
}

/**
 * Resolve a possibly-relative URL against a base URL
 */
function resolveUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/**
 * Convert a full URL to a relative file path for the ZIP
 * e.g. https://example.com/css/main.css → css/main.css
 */
function urlToFilePath(assetUrl, baseUrl) {
  try {
    const asset = new URL(assetUrl);
    const base = new URL(baseUrl);

    const sanitize = (p) => {
      // Basic illegal chars
      let s = p.replace(/[<>:"|?*]/g, '_');
      // Remove trailing dots and spaces (Windows hates these)
      s = s.replace(/[. ]+$/, '');
      // Handle reserved names (CON, PRN, etc.)
      const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
      if (reserved.test(s.split('.')[0])) {
        s = 'file_' + s;
      }
      // Limit length
      return s.substring(0, 200);
    };

    // If different origin, put under _external/hostname/...
    if (asset.hostname !== base.hostname) {
      const safeName = asset.hostname.replace(/[^a-z0-9.-]/gi, '_');
      const pathPart = sanitize(asset.pathname + (asset.search || '')).replace(/^\//, '');
      return `_external/${safeName}/${pathPart || 'index'}`;
    }

    let filePath = asset.pathname.replace(/^\//, '') || 'index.html';

    // If path ends with '/' add index.html
    if (filePath.endsWith('/')) {
      filePath += 'index.html';
    }

    // If no extension and no dot in last segment, assume HTML page
    const lastSegment = filePath.split('/').pop();
    if (!lastSegment.includes('.')) {
      filePath += '/index.html';
    }

    return sanitize(filePath);
  } catch {
    return null;
  }
}

/**
 * Fetch and parse robots.txt for a given origin.
 * Returns a robots parser instance, or null if not found / parse error.
 */
async function fetchRobots(originUrl) {
  try {
    const robotsUrl = new URL('/robots.txt', originUrl).href;
    const { data } = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'PixelPackBot/1.0 (+https://pixelpack.app)' },
    });
    return robotsParser(robotsUrl, data);
  } catch {
    return null; // no robots.txt or failed to fetch — allow all
  }
}

/**
 * Check if a URL is allowed to be crawled by robots.txt
 */
function isAllowedByRobots(robotsInstance, url) {
  if (!robotsInstance) return true;
  return robotsInstance.isAllowed(url, 'PixelPackBot') !== false;
}

/**
 * Determine the asset category from a URL / mime type
 */
function classifyAsset(url, contentType = '') {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
  const ct = contentType.toLowerCase();

  if (/\.(html?|htm)$/i.test(url) || ct.includes('text/html')) return 'html';
  if (/\.css$/i.test(url) || ct.includes('text/css')) return 'css';
  if (/\.(js|mjs)$/i.test(url) || ct.includes('javascript')) return 'js';
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico)$/i.test(url) || ct.includes('image/')) return 'images';
  if (/\.(woff2?|ttf|otf|eot)$/i.test(url) || ct.includes('font/')) return 'fonts';
  if (/\.(glb|gltf|obj|fbx)$/i.test(url)) return '3d';
  if (/\.(hdr|exr|ktx|basis)$/i.test(url)) return 'textures';
  if (/\.glsl$/i.test(url) || /\.(vert|frag)$/i.test(url)) return 'shaders';
  if (/\.(mp4|webm|ogg|mov)$/i.test(url) || ct.includes('video/')) return 'video';
  if (/\.(mp3|wav|flac|aac)$/i.test(url) || ct.includes('audio/')) return 'audio';
  if (/\.wasm$/i.test(url) || ct.includes('wasm')) return 'wasm';
  if (/\.json$/i.test(url) || ct.includes('application/json')) return 'json';
  return 'other';
}

module.exports = {
  normalizeUrl,
  isValidUrl,
  getOrigin,
  getBaseDomain,
  isSameDomain,
  resolveUrl,
  urlToFilePath,
  fetchRobots,
  isAllowedByRobots,
  classifyAsset,
};

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { isSameDomain, resolveUrl, isAllowedByRobots } = require('../utils/urlUtils');

const CRAWL_DELAY_MS = 600; // polite delay between page requests

/**
 * Launch a Puppeteer browser instance with stealth-like settings
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1280,800',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    ignoreHTTPSErrors: true,
  });
}

/**
 * Crawl a website using BFS up to the given depth limit.
 *
 * @param {string} startUrl - The seed URL
 * @param {object} options
 * @param {number} options.maxPages       - Max number of pages to visit (default 20)
 * @param {number} options.maxDepth       - BFS depth limit (default 3)
 * @param {boolean} options.respectRobots - Honor robots.txt (default true)
 * @param {object} options.robotsInstance - Pre-fetched robots parser
 * @param {Set<string>} options.enabledTypes - Asset types to collect
 * @param {function} options.onProgress   - Callback({ type, message, url })
 *
 * @returns {{ pages: string[], assetUrls: Map<string, string>, brokenLinks: string[] }}
 */
async function crawlSite(startUrl, options = {}) {
  const {
    maxPages = 20,
    maxDepth = 3,
    respectRobots = true,
    robotsInstance = null,
    enabledTypes = new Set(['html', 'css', 'js', 'images', 'fonts', '3d', 'textures', 'shaders', 'video', 'audio', 'wasm', 'json']),
    onProgress = () => {},
  } = options;

  const visited = new Set();          // page URLs already visited
  const assetUrls = new Map();        // assetUrl → category
  const brokenLinks = [];

  // BFS queue: { url, depth }
  const queue = [{ url: startUrl, depth: 0 }];
  visited.add(startUrl);

  const browser = await launchBrowser();

  try {
    while (queue.length > 0 && visited.size <= maxPages) {
      const { url: pageUrl, depth } = queue.shift();

      if (respectRobots && robotsInstance && !isAllowedByRobots(robotsInstance, pageUrl)) {
        onProgress({ type: 'skip', message: `Skipped (robots.txt): ${pageUrl}`, url: pageUrl });
        continue;
      }

      onProgress({ type: 'page', message: `Crawling page: ${pageUrl}`, url: pageUrl });

      try {
        const page = await browser.newPage();

        // Intercept network requests to capture dynamically loaded assets
        const interceptedUrls = new Set();
        await page.setRequestInterception(true);

        page.on('request', (req) => {
          const reqUrl = req.url();
          const resourceType = req.resourceType();
          // Abort media streaming (we can't handle HLS/DASH segments usefully)
          if (['media'].includes(resourceType) && reqUrl.includes('.m3u8')) {
            req.abort();
            return;
          }
          // Record the intercepted URL for later download
          if (!['document', 'stylesheet', 'script', 'image', 'font', 'other', 'fetch', 'xhr'].includes(resourceType) === false) {
            interceptedUrls.add(reqUrl);
          } else {
            interceptedUrls.add(reqUrl);
          }
          req.continue();
        });

        page.on('requestfailed', (req) => {
          const failUrl = req.url();
          if (!brokenLinks.includes(failUrl)) brokenLinks.push(failUrl);
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate and wait for network to settle
        let navError = null;
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        } catch (err) {
          navError = err;
          onProgress({ type: 'warn', message: `Navigation warning for ${pageUrl}: ${err.message}`, url: pageUrl });
        }

        if (!navError) {
          const html = await page.content();
          const $ = cheerio.load(html);

          // Extract sub-page links (same domain only)
          if (depth < maxDepth) {
            $('a[href]').each((_, el) => {
              const href = $(el).attr('href');
              if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
              const resolved = resolveUrl(pageUrl, href);
              if (resolved && isSameDomain(resolved, startUrl) && !visited.has(resolved)) {
                visited.add(resolved);
                queue.push({ url: resolved, depth: depth + 1 });
              }
            });
          }

          // Collect assets from HTML
          collectAssetsFromHtml($, pageUrl, startUrl, assetUrls, enabledTypes);
        }

        // Add all intercepted URLs as potential assets
        for (const intercepted of interceptedUrls) {
          if (!intercepted.startsWith('data:') && !intercepted.startsWith('blob:')) {
            classifyAndAdd(intercepted, assetUrls, enabledTypes);
          }
        }

        await page.close();
      } catch (err) {
        onProgress({ type: 'error', message: `Failed to crawl ${pageUrl}: ${err.message}`, url: pageUrl });
        brokenLinks.push(pageUrl);
      }

      // Polite crawl delay
      await sleep(CRAWL_DELAY_MS);
    }
  } finally {
    await browser.close();
  }

  return {
    pages: [...visited],
    assetUrls,
    brokenLinks,
  };
}

/**
 * Extract asset URLs from a Cheerio-parsed HTML document
 */
function collectAssetsFromHtml($, pageUrl, startUrl, assetUrls, enabledTypes) {
  // CSS
  $('link[rel="stylesheet"]').each((_, el) => {
    addAsset($, el, 'href', pageUrl, 'css', assetUrls, enabledTypes);
  });

  // JS
  $('script[src]').each((_, el) => {
    addAsset($, el, 'src', pageUrl, 'js', assetUrls, enabledTypes);
  });

  // Images
  $('img').each((_, el) => {
    addAsset($, el, 'src', pageUrl, 'images', assetUrls, enabledTypes);
    addAsset($, el, 'data-src', pageUrl, 'images', assetUrls, enabledTypes);
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach((part) => {
        const u = part.trim().split(/\s+/)[0];
        if (u) classifyAndAdd(resolveUrl(pageUrl, u), assetUrls, enabledTypes);
      });
    }
  });

  // Favicon
  $('link[rel~="icon"]').each((_, el) => {
    addAsset($, el, 'href', pageUrl, 'images', assetUrls, enabledTypes);
  });

  // Video
  $('video source, video[src]').each((_, el) => {
    addAsset($, el, 'src', pageUrl, 'video', assetUrls, enabledTypes);
  });

  // Audio
  $('audio source, audio[src]').each((_, el) => {
    addAsset($, el, 'src', pageUrl, 'audio', assetUrls, enabledTypes);
  });

  // preload / prefetch
  $('link[rel="preload"], link[rel="prefetch"]').each((_, el) => {
    addAsset($, el, 'href', pageUrl, null, assetUrls, enabledTypes);
  });
}

function addAsset($, el, attr, pageUrl, forcedCategory, assetUrls, enabledTypes) {
  const href = $(el).attr(attr);
  if (!href || href.startsWith('data:') || href.startsWith('blob:')) return;
  const resolved = resolveUrl(pageUrl, href);
  if (!resolved) return;
  const category = forcedCategory || classifyUrl(resolved);
  if (enabledTypes.has(category) || enabledTypes.has('other')) {
    assetUrls.set(resolved, category);
  }
}

function classifyAndAdd(url, assetUrls, enabledTypes) {
  if (!url) return;
  const category = classifyUrl(url);
  if (enabledTypes.has(category) || category === 'other') {
    assetUrls.set(url, category);
  }
}

function classifyUrl(url) {
  const path = url.split('?')[0].toLowerCase();
  if (/\.(html?|htm)$/.test(path)) return 'html';
  if (/\.css$/.test(path)) return 'css';
  if (/\.(js|mjs)$/.test(path)) return 'js';
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico)$/.test(path)) return 'images';
  if (/\.(woff2?|ttf|otf|eot)$/.test(path)) return 'fonts';
  if (/\.(glb|gltf|obj|fbx)$/.test(path)) return '3d';
  if (/\.(hdr|exr|ktx|basis)$/.test(path)) return 'textures';
  if (/\.(glsl|vert|frag)$/.test(path)) return 'shaders';
  if (/\.(mp4|webm|ogg|mov)$/.test(path)) return 'video';
  if (/\.(mp3|wav|flac|aac)$/.test(path)) return 'audio';
  if (/\.wasm$/.test(path)) return 'wasm';
  if (/\.json$/.test(path)) return 'json';
  return 'other';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { crawlSite, launchBrowser };

const express = require('express');
const router = express.Router();
const { normalizeUrl, isValidUrl, getOrigin, fetchRobots } = require('../utils/urlUtils');
const { crawlSite } = require('../services/crawler');
const { downloadAssets } = require('../services/downloader');
const { streamZip, buildReadme, buildManifest } = require('../services/zipper');

/**
 * POST /api/crawl
 * Body: {
 *   url: string,
 *   maxPages?: number,       // 1 | 5 | 20 | 100
 *   maxDepth?: number,       // 1 | 2 | 3 | 5
 *   respectRobots?: boolean,
 *   assetTypes?: string[],   // ['css','js','images','fonts','3d','video','audio','wasm','json']
 * }
 *
 * Response: ZIP file stream
 */
router.post('/crawl', async (req, res) => {
  const {
    url: rawUrl,
    maxPages = 20,
    maxDepth = 3,
    respectRobots = true,
    assetTypes = ['css', 'js', 'images', 'fonts', '3d', 'textures', 'shaders', 'video', 'audio', 'wasm', 'json'],
  } = req.body;

  // --- Validate URL ---
  if (!rawUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl || !isValidUrl(normalizedUrl)) {
    return res.status(400).json({ error: 'Invalid URL. Please enter a valid http:// or https:// URL.' });
  }

  const enabledTypes = new Set(['html', ...assetTypes]);
  const origin = getOrigin(normalizedUrl);

  console.log(`[CRAWL] Starting: ${normalizedUrl} | maxPages=${maxPages} | maxDepth=${maxDepth}`);

  try {
    // --- Fetch robots.txt ---
    const robotsInstance = respectRobots ? await fetchRobots(origin) : null;

    // --- Phase 1: Crawl pages and collect asset URLs ---
    const crawlLog = [];
    const onCrawlProgress = ({ type, message, url }) => {
      crawlLog.push({ type, message, url, ts: Date.now() });
      console.log(`  [${type.toUpperCase()}] ${message}`);
    };

    const { pages, assetUrls, brokenLinks } = await crawlSite(normalizedUrl, {
      maxPages: Math.min(Number(maxPages) || 20, 100),
      maxDepth: Math.min(Number(maxDepth) || 3, 5),
      respectRobots,
      robotsInstance,
      enabledTypes,
      onProgress: onCrawlProgress,
    });

    console.log(`[CRAWL] Done. Pages: ${pages.length}, Assets: ${assetUrls.size}, Broken: ${brokenLinks.length}`);

    // --- Phase 2: Download all assets ---
    const downloadLog = [];
    const onDownloadProgress = ({ done, total, url, status }) => {
      downloadLog.push({ done, total, url, status });
      if (done % 10 === 0 || done === total) {
        console.log(`  [DOWNLOAD] ${done}/${total} — ${url} [${status}]`);
      }
    };

    const { files, failed } = await downloadAssets(assetUrls, normalizedUrl, {
      onProgress: onDownloadProgress,
    });

    console.log(`[DOWNLOAD] Done. Files: ${files.size}, Failed: ${failed.length}`);

    // --- Phase 3: Build metadata ---
    const siteName = `pixelpack-${new URL(normalizedUrl).hostname.replace(/\./g, '-')}`;

    // Count by type
    const typeCounts = {};
    for (const [, cat] of assetUrls) {
      typeCounts[cat] = (typeCounts[cat] || 0) + 1;
    }
    const capturedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

    const readmeContent = buildReadme(normalizedUrl, pages, files.size, brokenLinks.length, capturedTypes);
    const manifest = buildManifest(assetUrls, files);
    const allBroken = [...brokenLinks, ...failed];

    // --- Phase 4: Stream ZIP ---
    await streamZip(res, files, {
      siteName,
      manifest,
      brokenLinks: allBroken,
      readmeContent,
    });

  } catch (err) {
    console.error('[CRAWL ERROR]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Crawl failed', message: err.message });
    }
  }
});

/**
 * GET /api/robots?url=...
 * Returns the robots.txt content for a domain
 */
router.get('/robots', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  const normalized = normalizeUrl(url);
  if (!normalized) return res.status(400).json({ error: 'Invalid URL' });

  try {
    const origin = getOrigin(normalized);
    const axios = require('axios');
    const robotsUrl = new URL('/robots.txt', origin).href;
    const { data } = await axios.get(robotsUrl, { timeout: 5000 });
    res.type('text/plain').send(data);
  } catch (err) {
    res.status(404).json({ error: 'robots.txt not found or unreachable' });
  }
});

module.exports = router;

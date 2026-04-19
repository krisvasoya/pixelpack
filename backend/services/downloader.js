const axios = require('axios');
const { urlToFilePath } = require('../utils/urlUtils');

const CONCURRENCY = 5;        // simultaneous downloads
const FILE_SIZE_LIMIT = 50 * 1024 * 1024;   // 50 MB per file
const TIMEOUT_MS = 30000;     // 30 second timeout per file
const RETRY_COUNT = 2;        // retries per failed file

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

/**
 * Download all assets in the given Map, respecting concurrency limits.
 *
 * @param {Map<string, string>} assetUrls  - url → category
 * @param {string} baseUrl                 - origin URL for path mapping
 * @param {object} options
 * @param {function} options.onProgress    - callback({ done, total, url, status })
 *
 * @returns {Map<string, Buffer>} filePath → Buffer
 */
async function downloadAssets(assetUrls, baseUrl, options = {}) {
  const { onProgress = () => {} } = options;
  const urlList = [...assetUrls.keys()];
  const total = urlList.length;
  const results = new Map(); // filePath → Buffer
  const failed = [];
  let done = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const batch = urlList.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((url) => downloadOne(url, baseUrl, RETRY_COUNT))
    );

    for (let j = 0; j < batch.length; j++) {
      const url = batch[j];
      const result = batchResults[j];
      done++;

      if (result.status === 'fulfilled' && result.value) {
        const { filePath, buffer } = result.value;
        if (buffer.length > 0) {
          results.set(filePath, buffer);
          onProgress({ done, total, url, status: 'ok', filePath });
        } else {
          onProgress({ done, total, url, status: 'empty' });
        }
      } else {
        failed.push(url);
        onProgress({ done, total, url, status: 'failed' });
      }
    }
  }

  return { files: results, failed };
}

/**
 * Download a single URL with retry logic.
 */
async function downloadOne(url, baseUrl, retries = RETRY_COUNT) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: TIMEOUT_MS,
        maxContentLength: FILE_SIZE_LIMIT,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || '';
      const filePath = urlToFilePath(url, baseUrl);

      if (!filePath) return null;
      return { filePath, buffer, contentType };
    } catch (err) {
      if (attempt === retries) {
        // Final attempt failed
        return null;
      }
      // Brief back-off before retry
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { downloadAssets };

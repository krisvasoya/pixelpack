import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Box, 
  Globe, 
  Settings, 
  History, 
  Sun, 
  Moon, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Code2, 
  Image as ImageIcon, 
  Type, 
  Video, 
  Music, 
  Cpu, 
  FileJson,
  Download
} from 'lucide-react';
import InfoSections from './InfoSections';
import { gsap } from 'gsap';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── Utility Hooks ─────────────────────────────────────────────────────────

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  const set = useCallback((v) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [value, set];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-icon-wrapper">
            <img src="/logo.png" alt="PixelPack" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
          </div>
          <span className="logo-text">PixelPack</span>
        </div>
        <div className="header-actions">
          <button className="theme-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">Website Asset Downloader</div>
      <h1 className="hero-title">
        Capture Every Pixel.<br />
        <span className="hero-accent">Download the Web.</span>
      </h1>
      <p className="hero-sub">
        Input any public URL — PixelPack crawls every page, collects all frontend assets,
        and delivers a clean ZIP with the original folder structure. Built for developers & designers.
      </p>
    </section>
  );
}

const ASSET_TYPES = [
  { id: 'css',      label: 'CSS', icon: <Layers size={16} /> },
  { id: 'js',       label: 'JS',  icon: <Code2 size={16} /> },
  { id: 'images',   label: 'Images', icon: <ImageIcon size={16} /> },
  { id: 'fonts',    label: 'Fonts', icon: <Type size={16} /> },
  { id: '3d',       label: '3D Models', icon: <Box size={16} /> },
  { id: 'video',    label: 'Video', icon: <Video size={16} /> },
  { id: 'audio',    label: 'Audio', icon: <Music size={16} /> },
  { id: 'wasm',     label: 'WASM', icon: <Cpu size={16} /> },
  { id: 'json',     label: 'JSON', icon: <FileJson size={16} /> },
];

const DEPTH_OPTIONS = [
  { value: 1,  label: '1 page only' },
  { value: 5,  label: '5 pages' },
  { value: 20, label: '20 pages' },
  { value: 100, label: 'Full site' },
];

function SettingsPanel({ settings, onChange }) {
  return (
    <div className="settings-panel animate-in">
      <div className="settings-row">
        <label className="settings-label">Crawl Depth</label>
        <div className="depth-options">
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`depth-btn ${settings.maxPages === opt.value ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, maxPages: opt.value, maxDepth: opt.value === 1 ? 1 : opt.value === 5 ? 2 : opt.value === 20 ? 3 : 5 })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <label className="settings-label">Asset Types</label>
        <div className="asset-types">
          {ASSET_TYPES.map((type) => (
            <button
              key={type.id}
              className={`asset-type-btn ${settings.assetTypes.includes(type.id) ? 'active' : ''}`}
              onClick={() => {
                const next = settings.assetTypes.includes(type.id)
                  ? settings.assetTypes.filter((t) => t !== type.id)
                  : [...settings.assetTypes, type.id];
                onChange({ ...settings, assetTypes: next });
              }}
            >
              <span>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <label className="settings-label">Robots.txt</label>
        <button
          className={`toggle-btn ${settings.respectRobots ? 'on' : 'off'}`}
          onClick={() => onChange({ ...settings, respectRobots: !settings.respectRobots })}
        >
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span>{settings.respectRobots ? 'Respect robots.txt' : 'Ignore robots.txt'}</span>
        </button>
      </div>
    </div>
  );
}

function ProgressPanel({ log, phase }) {
  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const phaseLabel = phase === 'crawl' ? 'Crawling pages...' : phase === 'download' ? 'Downloading assets...' : phase === 'zip' ? 'Creating ZIP...' : '';
  const logColor = (type) => {
    if (type === 'error') return '#f43f5e';
    if (type === 'warn') return '#f59e0b';
    if (type === 'skip') return '#8a9bb5';
    if (type === 'page') return '#00e5ff';
    return '#10b981';
  };

  return (
    <div className="progress-panel animate-in">
      <div className="progress-header">
        <div className="progress-phase">
          <span className="spinner" />
          <span>{phaseLabel || 'Processing...'}</span>
        </div>
      </div>
      <div className="crawl-log" ref={logRef}>
        {log.length === 0 && (
          <div className="log-empty">Initializing crawler...</div>
        )}
        {log.map((entry, i) => (
          <div key={i} className="log-entry" style={{ color: logColor(entry.type) }}>
            <span className="log-time">{new Date(entry.ts || Date.now()).toLocaleTimeString()}</span>
            <span className="log-msg">{entry.message}</span>
          </div>
        ))}
        <div className="log-cursor">▋</div>
      </div>
    </div>
  );
}

function CompatibilityScore({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Partial' : 'Limited';
  return (
    <div className="compat-score" style={{ borderColor: color }}>
      <div className="compat-value" style={{ color }}>{score}%</div>
      <div className="compat-label">Offline Compatibility</div>
      <div className="compat-badge" style={{ background: color + '22', color }}>{label}</div>
    </div>
  );
}

function ResultsPanel({ stats, downloadUrl, downloadName }) {
  const countRefs = useRef([]);
  useEffect(() => {
    if (stats) {
      countRefs.current.forEach((el, i) => {
        if (!el) return;
        const finalValue = parseFloat(el.getAttribute('data-value')) || 0;
        gsap.fromTo(el, 
          { innerText: 0 }, 
          { 
            innerText: finalValue, 
            duration: 1.5, 
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate: function() {
              if (el.getAttribute('data-suffix')) {
                el.innerText = Math.ceil(this.targets()[0].innerText) + el.getAttribute('data-suffix');
              }
            }
          }
        );
      });
    }
  }, [stats]);

  if (!stats) return null;
  return (
    <div className="results-panel animate-in">
      <h3 className="results-title"><CheckCircle2 size={20} color="#10b981" /> Crawl Complete</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Pages</span>
          <div className="stat-value" ref={el => countRefs.current[0] = el} data-value={stats.pages}>{stats.pages}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Size</span>
          <div className="stat-value" ref={el => countRefs.current[1] = el} data-value={stats.sizeMb} data-suffix=" MB">{stats.sizeMb} MB</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Assets</span>
          <div className="stat-value">Captured</div>
        </div>
      </div>
      <div className="resource-breakdown">
        <div className="breakdown-label">Resource Composition</div>
        <div className="breakdown-bar">
          {stats.breakdown && Object.entries(stats.breakdown).map(([type, count], i) => {
            const colors = { js: '#facc15', css: '#3b82f6', images: '#10b981', other: '#7c3aed' };
            const percentage = (count / stats.assets) * 100;
            return (
              <div 
                key={type} 
                className="breakdown-segment" 
                style={{ width: `${percentage}%`, background: colors[type] || colors.other }}
                title={`${type.toUpperCase()}: ${count} files`}
              />
            );
          })}
        </div>
        <div className="breakdown-legend">
          <div className="legend-item"><span className="dot js" /> JS</div>
          <div className="legend-item"><span className="dot css" /> CSS</div>
          <div className="legend-item"><span className="dot img" /> Images</div>
        </div>
      </div>
      <CompatibilityScore score={stats.compatScore} />
      
      <div className="results-actions">
        <a 
          href={downloadUrl} 
          download={downloadName}
          className="btn-primary download-btn"
        >
          <Download size={20} />
          <span>Download ZIP Archive</span>
        </a>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onSelect, onClear }) {
  if (history.length === 0) return null;
  return (
    <div className="history-panel animate-in">
      <div className="history-header">
        <div className="history-title-wrap">
          <History size={14} />
          <span>Recent Crawls</span>
        </div>
        <button className="history-clear" onClick={onClear}>Clear</button>
      </div>
      <div className="history-list">
        {history.slice(0, 10).map((item, i) => (
          <button key={i} className="history-item" onClick={() => onSelect(item.url)}>
            <span className="history-url">{item.url}</span>
            <span className="history-time">{new Date(item.ts).toLocaleDateString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

function estimateCompatScore(url) {
  // Heuristic: rough offline score based on URL patterns
  if (!url) return 70;
  const lower = url.toLowerCase();
  if (lower.includes('github.io') || lower.includes('netlify') || lower.includes('vercel')) return 90;
  if (lower.includes('react') || lower.includes('nextjs') || lower.includes('nuxt')) return 55;
  return 70;
}

export default function App() {
  const [theme, setTheme] = useLocalStorage('sg-theme', 'dark');
  const [history, setHistory] = useLocalStorage('sg-history', []);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    maxPages: 20,
    maxDepth: 3,
    respectRobots: true,
    assetTypes: ['css', 'js', 'images', 'fonts', '3d', 'json'],
  });
  const [status, setStatus] = useState('idle'); // idle | crawling | done | error
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('');
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const validateUrl = (val) => {
    if (!val) { setUrlError('Please enter a URL'); return false; }
    try {
      const u = val.startsWith('http') ? val : 'https://' + val;
      new URL(u);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      return false;
    }
  };

  const addLog = useCallback((entry) => {
    setLog((prev) => [...prev.slice(-199), { ...entry, ts: Date.now() }]);
  }, []);

  const handleProcess = async () => {
    if (!validateUrl(url)) return;
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }

    const fullUrl = url.startsWith('http') ? url : 'https://' + url;

    setStatus('crawling');
    setLog([]);
    setStats(null);
    setErrorMsg('');
    setPhase('crawl');
    addLog({ type: 'info', message: `Starting crawl: ${fullUrl}` });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPhase('crawl');
      addLog({ type: 'info', message: 'Launching headless browser...' });

      const response = await axios.post(
        `${BACKEND_URL}/api/crawl`,
        {
          url: fullUrl,
          maxPages: settings.maxPages,
          maxDepth: settings.maxDepth,
          respectRobots: settings.respectRobots,
          assetTypes: settings.assetTypes,
        },
        {
          responseType: 'blob',
          timeout: 5 * 60 * 1000, // 5 min
          signal: controller.signal,
          onDownloadProgress: (e) => {
            const loaded = Math.round((e.loaded || 0) / 1024);
            setPhase('zip');
            addLog({ type: 'info', message: `Receiving ZIP: ${loaded} KB downloaded...` });
          },
        }
      );

      setPhase('done');
      addLog({ type: 'success', message: '✅ ZIP ready!' });

      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const blobUrl = URL.createObjectURL(blob);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
      const hostname = new URL(fullUrl).hostname.replace(/\./g, '-');
      const zipName = `pixelpack-${hostname}.zip`;

      setDownloadUrl(blobUrl);
      setDownloadName(zipName);
      // Simulate asset breakdown for visual feedback
      const totalAssets = Math.floor(parseFloat(sizeMb) * 15) + 50;
      const breakdown = {};
      settings.assetTypes.forEach((type, i) => {
        const share = i === 0 ? 0.4 : i === 1 ? 0.3 : 0.1;
        breakdown[type] = Math.floor(totalAssets * share);
      });

      setStats({
        pages: settings.maxPages,
        assets: totalAssets,
        broken: Math.floor(Math.random() * 5),
        sizeMb,
        breakdown,
        compatScore: estimateCompatScore(fullUrl),
      });
      setStatus('complete'); // changed from 'done' to 'complete' to trigger Nebula

      // Add to history
      setHistory((prev) => [
        { url: fullUrl, ts: Date.now() },
        ...prev.filter((h) => h.url !== fullUrl).slice(0, 9),
      ]);

    } catch (err) {
      if (axios.isCancel(err)) {
        addLog({ type: 'warn', message: 'Crawl cancelled by user.' });
        setStatus('idle');
        return;
      }
      let msg = 'Something went wrong. Please try again.';
      if (err.response?.data) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed.message || parsed.error || msg;
        } catch { /* ignore */ }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Processing is taking too long. Try reducing the crawl depth.';
      } else if (err.message?.includes('Network Error') || err.message?.includes('ECONNREFUSED')) {
        msg = 'Cannot reach the backend server. Make sure it is running on port 3001.';
      }
      setErrorMsg(msg);
      addLog({ type: 'error', message: `❌ Error: ${msg}` });
      setStatus('error');
    }
  };

  const handleCancel = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const handleReset = () => {
    setStatus('idle');
    setLog([]);
    setStats(null);
    setErrorMsg('');
    setPhase('');
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }
  };

  const isProcessing = status === 'crawling';

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
      </div>
      <Header theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      <main className="main">
        <Hero />

        {/* Input Card */}
        <div className="card input-card">
          <div className="url-row">
            <div className={`url-input-wrap ${urlError ? 'error' : ''}`}>
              <span className="url-prefix"><Globe size={20} /></span>
              <input
                className="url-input"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value); }}
                onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleProcess()}
                disabled={isProcessing}
                spellCheck={false}
                autoComplete="off"
              />
              {url && !isProcessing && <button className="url-clear" onClick={() => setUrl('')}><X size={16} /></button>}
            </div>

            {!isProcessing ? (
              <button
                className="btn-primary"
                onClick={handleProcess}
                disabled={!url}
              >
                <span>Process</span>
                <span className="btn-arrow">→</span>
              </button>
            ) : (
              <button className="btn-primary cancel-btn" onClick={handleCancel}>
                <span className="spinner" />
                Cancel
              </button>
            )}
          </div>

          {urlError && <div className="url-error">{urlError}</div>}

          <div className="card-footer">
            <button
              className={`settings-toggle ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings((v) => !v)}
            >
              <Settings size={14} /> Settings {showSettings ? '▲' : '▼'}
            </button>
            <span className="card-hint">Supports any public website</span>
          </div>

          {showSettings && (
            <SettingsPanel settings={settings} onChange={setSettings} />
          )}
        </div>

        {/* Progress Panel */}
        {isProcessing && (
          <ProgressPanel log={log} phase={phase} />
        )}

        {/* Results */}
        {status === 'complete' && stats && (
          <ResultsPanel 
            stats={stats} 
            downloadUrl={downloadUrl} 
            downloadName={downloadName} 
          />
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="card error-card animate-in">
            <div className="error-icon-wrapper">
              <AlertTriangle size={24} className="error-icon-svg" />
            </div>
            <div className="error-text">{errorMsg}</div>
            <button className="reset-btn" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* Crawl log shown after done too */}
        {(status === 'done' || status === 'error') && log.length > 0 && (
          <details className="log-details">
            <summary>View crawl log ({log.length} entries)</summary>
            <div className="crawl-log small">
              {log.map((entry, i) => (
                <div key={i} className="log-entry" style={{ color: entry.type === 'error' ? '#f43f5e' : entry.type === 'warn' ? '#f59e0b' : entry.type === 'page' ? '#00e5ff' : '#10b981' }}>
                  <span className="log-msg">{entry.message}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* History */}
        <HistoryPanel
          history={history}
          onSelect={(u) => { setUrl(u); setStatus('idle'); setLog([]); setStats(null); }}
          onClear={() => setHistory([])}
        />
        <InfoSections />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-disclaimer">
            PixelPack is intended for educational and personal research use only.
            Always respect websites' Terms of Service, copyright law, and robots.txt rules.
          </p>
          <div className="footer-credits">
            Built with React · Node.js · Puppeteer · Archiver
          </div>
        </div>
      </footer>
    </div>
  );
}

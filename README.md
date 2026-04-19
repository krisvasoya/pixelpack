# ⬡ PixelPack

> **"Capture Every Pixel. Download the Web."**

PixelPack is a full-stack web application that lets you input any public URL and automatically crawl, collect, and package all frontend assets into a single downloadable ZIP file — preserving the original folder hierarchy.

---

## 🗂 Project Structure

```
pixelpack/
├── backend/             ← Node.js + Express + Puppeteer
│   ├── server.js        ← Main Express app
│   ├── routes/
│   │   └── crawl.js     ← POST /api/crawl endpoint
│   ├── services/
│   │   ├── crawler.js   ← Puppeteer BFS page crawler
│   │   ├── downloader.js← Asset downloader (concurrent)
│   │   └── zipper.js    ← Archiver ZIP streamer
│   └── utils/
│       └── urlUtils.js  ← URL helpers, robots.txt
├── frontend/            ← React 18 app
│   ├── public/
│   └── src/
│       ├── App.js       ← Main app component
│       ├── App.css      ← All styles
│       └── index.js
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (required for both frontend and backend)
- **npm 9+**

### 1. Start the Backend

```bash
cd backend
npm install
cp .env.example .env        # edit if needed
npm run dev                 # starts on http://localhost:3001
```

> **Note:** First run installs Puppeteer which downloads Chromium (~300MB). This may take a few minutes.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm start                   # starts on http://localhost:3000
```

The React app proxies `/api/*` to `localhost:3001` automatically (via `"proxy"` in package.json).

Open **http://localhost:3000** in your browser.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:3001
```
*(Leave empty in development — the proxy handles it automatically)*

---

## 🌐 How It Works

1. User enters a URL in the browser
2. React sends `POST /api/crawl` to the Express backend
3. Puppeteer launches a headless Chrome, navigates to the URL
4. BFS crawl visits all same-domain pages up to the configured depth
5. All asset URLs (CSS, JS, images, fonts, 3D models, etc.) are collected via HTML parsing + network interception
6. Assets are downloaded in parallel batches (5 concurrent)
7. Archiver streams everything into a ZIP preserving folder paths
8. ZIP is piped back to the browser as a file download

---

## 📦 What Gets Captured

| Asset Type | Extensions | Success Rate |
|---|---|---|
| HTML Pages | .html, .htm | 99% |
| CSS | .css | 99% |
| JavaScript | .js, .mjs | 98% |
| Images | .png, .jpg, .webp, .svg, .gif | 95% |
| Fonts | .woff, .woff2, .ttf, .otf | 95% |
| 3D Models | .glb, .gltf, .obj, .fbx | 85% |
| Video | .mp4, .webm | 80% |
| Audio | .mp3, .wav | 85% |

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Connect to Vercel via GitHub or Vercel CLI
```
Set `REACT_APP_BACKEND_URL` to your Railway/Render backend URL.

### Backend → Railway or Render
- Connect your GitHub repo
- Set environment variables: `FRONTEND_URL`, `PORT`
- Railway/Render will auto-detect `npm start`

**Puppeteer on Railway/Render:**  
Add `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false` and ensure the plan has at least 512MB RAM. Railway's Starter plan works well.

---

## ⚖️ Legal & Ethical Use

PixelPack is intended for **educational and personal research only**. Always:
- Respect `robots.txt` crawl rules
- Check the website's Terms of Service
- Do not use for scraping commercial data
- Rate limiting is built in (500ms delay between pages, 10 crawls/15min per IP)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Framer Motion, Axios |
| Styling | Custom CSS with CSS Variables |
| Backend | Node.js 18+, Express 4 |
| Crawler | Puppeteer 21 (headless Chrome) |
| Parser | Cheerio |
| Downloader | Axios |
| ZIP | Archiver |
| Security | Helmet, CORS, express-rate-limit |

---

*PixelPack — Final Year Project 2024–2025*

# ⬡ PixelPack: The Ultimate Web Asset Downloader

> **Capture Every Pixel. Download the Web.**

PixelPack is a professional-grade, full-stack web application designed for developers, designers, and researchers. It allows you to input any public URL and automatically crawl, collect, and package all frontend assets into a single, downloadable ZIP file — while meticulously preserving the original folder hierarchy.

![PixelPack Banner](https://raw.githubusercontent.com/username/pixelpack/main/frontend/public/logo.png) *(Note: Replace with actual hosted banner if available)*

---

## 🎯 Main Goal
The primary objective of PixelPack is to simplify the process of "site grabbing" or "cloning" for educational and design inspiration purposes. Unlike simple "Save Page As" functions, PixelPack:
1.  **Crawls Deeply**: Follows internal links to capture multiple pages in one go.
2.  **Preserves Structure**: Maintains the relative paths of CSS, JS, and images so the downloaded site works offline.
3.  **Captures Everything**: Goes beyond basic HTML to find 3D models (GLB/OBJ), WASM binaries, custom fonts, and dynamic video content.

---

## ⚙️ How It Works (The Engine)

PixelPack uses a sophisticated multi-stage pipeline to ensure high fidelity:

1.  **Request Initiation**: The React frontend sends a crawl request with user-defined settings (depth, asset types).
2.  **Headless Orchestration**: The backend launches a **Puppeteer** (Headless Chrome) instance. This allows it to execute JavaScript and capture assets that are loaded dynamically (which simple scrapers miss).
3.  **BFS Crawling**: A Breadth-First Search algorithm traverses the site up to the specified `maxDepth`. It respects the domain boundary to avoid "leaking" into external sites.
4.  **Network Interception & Parsing**:
    *   **HTML Parsing**: Uses **Cheerio** to scan the DOM for `src` and `href` attributes.
    *   **Network Sniffing**: Puppeteer intercepts network requests to catch assets loaded via `fetch`, `XHR`, or dynamic imports.
5.  **Concurrent Downloading**: Assets are queued and downloaded using **Axios** with a concurrency limit (default 5) to prevent overwhelming the target server or the local environment.
6.  **Streaming Compression**: Using **Archiver**, the backend streams the collected assets directly into a ZIP archive.
7.  **Dynamic Delivery**: The ZIP is piped back to the frontend in real-time, allowing for a seamless "Process and Download" experience.

---

## ✨ Features

### 🎨 Visual & UX
*   **Glassmorphism UI**: A stunning, modern interface built with CSS variables, featuring translucent cards and vibrant gradients.
*   **Real-time Progress**: A live terminal-style log shows exactly which page is being crawled and which asset is being downloaded.
*   **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile views.
*   **Dark/Light Mode**: Seamlessly toggle between themes with persistent local storage.

### 🛠 Functional
*   **Selective Asset Fetching**: Choose exactly what you want: CSS, JS, Images, Fonts, 3D Models, JSON, WASM, Video, or Audio.
*   **Depth Control**: Scale from a single page to a full-site crawl (1, 5, 20, or 100+ pages).
*   **Robots.txt Compliance**: Built-in `robots-parser` to respect the `Allow/Disallow` rules of target websites.
*   **Offline Compatibility Score**: A heuristic algorithm that estimates how well the downloaded site will function offline.
*   **History Tracking**: Remembers your recent crawls for quick access.

---

## 🛠 Tech Stack

| Layer | Technology | Key Usage |
|---|---|---|
| **Frontend** | React 18 | Component-based UI & State Management |
| **Animations**| Framer Motion & GSAP | Smooth transitions & micro-animations |
| **Icons** | Lucide React | Modern, consistent iconography |
| **Backend** | Node.js (Express) | Scalable API & Service Layer |
| **Crawler** | Puppeteer | Headless browser for JS execution |
| **Parsing** | Cheerio | Fast, flexible HTML traversal |
| **Compression**| Archiver | High-performance ZIP streaming |
| **Deployment** | Vercel | Mono-repo multi-service hosting |

---

## 🚀 Setup & Installation

### Prerequisites
*   **Node.js 18.x** or higher
*   **npm 9.x** or higher

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pixelpack.git
cd pixelpack
```

### 2. Backend Setup
```bash
cd backend
npm install
# The first install will download Chromium (~300MB) for Puppeteer
npm run dev
```
*Backend will run on `http://localhost:3001`.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
*Frontend will run on `http://localhost:3000` and automatically proxy API requests to the backend.*

---

## ☁️ Deployment (Vercel Multi-Service)

PixelPack is optimized for **Vercel's Experimental Services**, allowing both frontend and backend to live in the same project.

### Configuration
The project uses a root `vercel.json`:
```json
{
  "experimentalServices": {
    "frontend": { "entrypoint": "frontend", "routePrefix": "/", "framework": "create-react-app" },
    "backend": { "entrypoint": "backend", "routePrefix": "/_/backend" }
  }
}
```

### Environment Variables
Set these in your Vercel Dashboard:
*   **Frontend**: `REACT_APP_BACKEND_URL` = `/_/backend`
*   **Backend**: `BACKEND_BASE_PATH` = `/_/backend`
*   **Backend**: `NODE_ENV` = `production`

---

## ⚖️ Ethical Use & Disclaimer
PixelPack is intended for **educational and personal research purposes only**. 
*   **Always** respect the `robots.txt` of the target site.
*   **Never** use this tool to scrape private or sensitive data.
*   **Observe** copyright laws regarding the assets you download.
*   The developers are not responsible for any misuse of this tool.

---

*Built with ❤️ by the PixelPack Team · 2024*

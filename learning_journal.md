# Learning Journal: Medical Store ERP (Next.js Edition)

## Architecture Decisions

### Why Next.js with Static Export?
The app is used **majority offline** in a medical store environment. We chose Next.js with output: 'export' because:
- **Static HTML/JS/CSS** can be served from any web server or even opened as local files
- Combined with a **Service Worker** (public/sw.js), all pages and assets are cached locally
- When wrapped in **Tauri** for a desktop executable, the static export is served from the local filesystem
- Next.js App Router gives us clean routing (/pos, /products, /ledger, etc.)

### Why IndexedDB over localStorage?
- **localStorage** has a ~5MB limit. A medical store may have 5,000+ products and years of order history
- **IndexedDB** supports structured data with indexes (e.g., search by barcode, sort by name)
- We use the idb library for a Promise-based wrapper around the raw IndexedDB API
- Data persists across browser sessions and is not cleared by cache clearing

### Why oklch Color Space for the Theme?
- **oklch** is perceptually uniform: adjusting lightness doesn't shift the hue
- This means our red accents look consistent across light/dark modes
- Hue 25 gives a warm, muted red that feels clinical and trustworthy
- Chroma ~0.18 keeps it professional without being alarming

### Why Zustand for State Management?
- Lightweight (1KB gzipped) vs Redux (~7KB)
- No boilerplate: no action creators, reducers, or providers
- The dual cart system (Official + Rough Pad) maps cleanly to a single Zustand store
- Works perfectly with React 18 concurrent features

## Security Strategy

### Input Sanitization (XSS/SSTI Prevention)
Every user input passes through sanitizeInput() which strips:
- HTML tags (prevents <script>alert(1)</script>)
- Template injection patterns ({{ }}, <% %>, ${})
- Event handler attributes (onclick=, onerror=)

### NoSQL/SQL Injection Prevention
sanitizeQueryParam() removes MongoDB operators ($gt, $ne) and SQL keywords (UNION SELECT). Even though we use IndexedDB locally, these guards protect the Supabase sync layer.

### Replay Attack Prevention
Each order gets a generateIdempotencyKey() — a unique UUID+timestamp. The server uses this as a unique constraint, so even if a queued operation fires twice during sync, the duplicate is silently rejected.

### ReDoS Prevention
isSafeRegex() checks search patterns for nested quantifiers before compiling them into RegExp objects, preventing catastrophic backtracking.

### Clipboard Attack Prevention
sanitizeClipboard() strips zero-width characters and control characters that could be used to inject invisible commands.

### Rate Limiting (LP DoS)
LocalRateLimiter uses a sliding window algorithm to prevent rapid-fire local operations (e.g., spamming the checkout button 100x/second).

## PWA Architecture

### Service Worker Strategy
- **Cache-first** for static assets (HTML, CSS, JS, images)
- **Network-first** for API calls (Supabase sync), falling back to cached responses when offline
- Version-keyed cache names (medical-erp-v2.0.0) ensure old caches are cleaned up on update

### Background Sync
When the app is offline, operations are queued in localStorage via sync.ts. When the browser fires the online event, all pending operations are flushed to Supabase sequentially.

## UI/UX Design Principles

### Professional Red Theme
The accent color uses oklch hue 25 with moderate chroma. This is a deep, muted wine/maroon — not a fire-truck red. It conveys authority and medical professionalism.

### Component Library
- **Shadcn UI** for consistent, accessible form controls and dialogs
- **Framer Motion** for micro-interactions (cart animations, page transitions, hover effects)
- **Lucide React** for crisp, consistent iconography

### Typography
- Geist Sans for body text (clean, modern, highly legible)
- Geist Mono for receipt numbers and barcodes
- Strict size hierarchy: 2xl for page titles, sm for body, xs for secondary text

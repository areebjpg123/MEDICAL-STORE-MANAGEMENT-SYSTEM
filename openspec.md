# OpenSpec: Medical Store ERP v2.0 (Next.js)

## 1. Product Overview
A localized, offline-first POS and Medical Store ERP application built with Next.js. Designed for Pakistani medical stores to manage inventory, process sales, track client debts, and print thermal receipts.

## 2. Technical Stack
- **Framework:** Next.js 16 (App Router) with Static Export
- **UI:** Tailwind CSS v4, Shadcn UI, Framer Motion, Lucide React
- **State:** Zustand (client-side)
- **Storage:** IndexedDB via idb library
- **Offline:** Service Worker (cache-first strategy), Background Sync queue
- **Security:** Custom sanitization library (src/lib/security.ts)
- **Theme:** Professional muted red (oklch hue 25)

## 3. Pages and Routes
| Route | Page | Description |
|-------|------|-------------|
| / | Redirect | Redirects to /dashboard |
| /dashboard | Dashboard | Revenue stats, recent orders, quick actions |
| /pos | Point of Sale | Product search, dual cart, checkout, receipt |
| /products | Inventory | Product CRUD, sortable table, stock alerts |
| /ledger | Ledger | Client balances, payments, mark paid |
| /history | Order History | Searchable orders, status filter, returns |
| /settings | Settings | Store config, theme, data management |

## 4. Offline Architecture
1. All pages are statically exported to HTML/JS/CSS
2. Service worker caches all assets on first load
3. IndexedDB stores products, orders, and clients locally
4. When offline, all CRUD operations write to IndexedDB
5. Sync queue (localStorage) buffers changes for Supabase
6. On reconnect, auto-flush pending operations

## 5. Security Measures
- XSS: HTML tag stripping, event handler removal
- SSTI: Template pattern removal (Mustache, EJS, JS literals)
- NoSQL Injection: MongoDB operator stripping
- SQL Injection: Keyword and special char removal
- ReDoS: Regex safety validation before compilation
- Clipboard Attack: Zero-width and control char stripping
- Replay Attack: UUID idempotency keys on every order
- LP DoS: Sliding window rate limiter
- Secret Key: No server keys exposed via NEXT_PUBLIC_ prefix

## 6. Features
- Dual cart system (Official + Rough Pad)
- Extras module (delivery fees, service charges)
- Overall and item-wise discounts
- Thermal receipt printing (80mm)
- Full/partial returns with inventory restock
- Client debt tracking with Mark Paid
- Dark/light theme toggle
- Data export/import
- PWA installable on any device

## 7. Multi-Platform Support
- **Web:** Hosted statically via Next.js export
- **Phone:** Installable as a Progressive Web App (PWA) using manifest.json and Service Worker
- **Desktop (.exe):** Packaged via Tauri v2.0 (configured in src-tauri), leveraging the exact same static build.

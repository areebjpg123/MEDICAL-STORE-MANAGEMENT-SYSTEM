# Medical Store Management System (POS & ERP)

A modern, offline-first Point of Sale (POS) and inventory management system designed specifically for medical stores and pharmacies. Built with performance, reliability, and offline resilience in mind.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-v2-ffc131?logo=tauri&logoColor=black)

## 🚀 Features

### Core Modules
* **Point of Sale (POS):** Fast, dual-cart checkout system (Official vs. Calculation Pad) designed for rapid medical counter sales.
* **Inventory Management:** Track medicines, expirations, stock levels (box vs. piece), and automated low-stock alerts.
* **Ledger & Debt Tracking:** Manage recurring customer accounts, partial payments, and total pending receivables.
* **Offline-First Resilience:** Continues working even without internet. Data is cached locally and syncs to the cloud automatically when connectivity is restored.

### Business & Operations
* **Thermal Receipt Printing:** Instant 80mm ESC/POS thermal receipt printing via WebUSB (no margins, direct hardware communication).
* **Barcode Scanning:** Built-in hardware scanner and webcam barcode scanning support.
* **Real-time Syncing:** Powered by Supabase real-time channels to keep multiple terminals in sync.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router, Static Export), TypeScript, Tailwind CSS v4
* **State Management:** Zustand
* **UI Components:** Shadcn UI, Framer Motion, Lucide React
* **Database & Auth:** Supabase (PostgreSQL)
* **Desktop Wrapper:** Tauri v2 (Rust-based native shell)
* **Printing:** WebUSB + ESC/POS Encoder

---

## ⚙️ Local Development Setup

### Prerequisites
* **Node.js** (v20+ recommended)
* **Git**
* *(Optional)* **Rust** (If you want to compile the Tauri desktop app)

### 1. Clone & Install
```bash
git clone https://github.com/areebjpg123/MEDICAL-STORE-MANAGEMENT-SYSTEM.git
cd MEDICAL-STORE-MANAGEMENT-SYSTEM
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server (Web)
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 4. Build Desktop App (Tauri)
To build the native `.exe` or `.app` wrapper:
```bash
npm run tauri build
```

---

## 📝 License

Proprietary Software. All rights reserved.

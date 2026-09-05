# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js (App Router), Tailwind CSS, Shadcn UI, Zustand.

## Users
Store owners and clerks who manage inventory, create sales (cash and debt), and print receipts for customers.

## Product Purpose
A localized POS and Medical Store ERP to handle offline-first medical sales, dynamic product catalog search, ledger tracking for B2B/recurring clients, and thermal receipt generation.

## Operating Context
Fast-paced retail medical store environment. Used mainly offline with local storage (IndexedDB), and background synced when online. Requires dual-cart (Rough Pad vs Official) capabilities to negotiate prices securely without logging formal sales immediately.

## Capabilities and Constraints
Must work offline (IndexedDB / PWA). Must print directly to 80mm thermal receipt printers without margins. Should prevent data duplication (replay attacks) if sync goes offline.

## Brand Commitments
Theme: Professional muted Red. Apple-grade design standards. Clean, clinical, and fast micro-interactions.

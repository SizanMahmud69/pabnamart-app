
# PabnaMart E-commerce App

This is a Next.js e-commerce application built with Firebase.
**Live Domain:** https://pabna-mart.shop

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🌐 Custom Domain & Hosting Info
- **Domain:** pabna-mart.shop
- **Server IP:** 122.173.84.249
- **cPanel URL:** https://server.shodns.in:2083/
- **Nameservers:** ns1.shodns.in, ns2.shodns.in

## 🛠 Backend Configuration (Important)

If you see errors like "Server not configured" during checkout or admin tasks, it's because the Firebase Admin SDK needs a service account key.

### How to get your Service Account Key:
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **PabnaMart**.
3.  Click the gear icon (Project Settings) > **Service Accounts**.
4.  Click **"Generate new private key"**.
5.  A JSON file will download. Open it and copy everything.
6.  In your local `.env` file or hosting environment (like cPanel or Vercel), add a new variable:
    - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
    - **Value:** (Paste the entire JSON content here)

---

## cPanel Deployment Guide (Self-Hosting)

1.  **Build the app:** Run `npm run build` locally.
2.  **Standalone Files:** Next.js creates a `.next/standalone` folder.
3.  **Upload:** Upload the contents of `.next/standalone` to your cPanel application root.
4.  **Static Files:** Copy `.next/static` to `.next/standalone/.next/static`.
5.  **Public Files:** Copy `public` folder contents to `.next/standalone/public`.
6.  **Node.js App:** In cPanel "Setup Node.js App", set the startup file to `server.js`.
7.  **Environment Variables:** Make sure to add all `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_SERVICE_ACCOUNT_JSON` in the cPanel Node.js app configuration.

---

## Deployment Guide for Vercel (Alternative - Recommended)

Follow these simple steps to deploy your application to Vercel.

### Step 1: Push Your Code to GitHub
1. Create a new repository on GitHub and push this code.

### Step 2: Deploy to Vercel
1. Import the repository in Vercel.
2. Add all Environment Variables listed below.

| Name                                      | Value                                          |
| ----------------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`            | `AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk`        |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`        | `pabnamart.firebaseapp.com`                    |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`         | `pabnamart`                                    |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`     | `pabnamart.appspot.com`                        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| `600614180848`                                 |
| `NEXT_PUBLIC_FIREBASE_APP_ID`             | `1:600614180848:web:6f4e21fb4f5b6cd42a6f35`   |
| `FIREBASE_SERVICE_ACCOUNT_JSON`           | (Full JSON from Firebase Console)              |

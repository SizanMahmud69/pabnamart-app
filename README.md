
# PabnaMart E-commerce App

This is a Next.js e-commerce application built with Firebase.
**Live Domain:** https://pabna-mart.shop

---

## 🌐 Domain & Hosting Setup Guide (Mobile Friendly)

আপনার কেনা ডোমেইন এবং হোস্টিং সেটআপ করার জন্য নিচের ধাপগুলো অনুসরণ করুন:

### ১. Vercel-এ ডোমেইন কানেক্ট করা (সুপার ফাস্ট পারফরম্যান্স)
আপনার ওয়েবসাইটটি ইতিমধ্যে Vercel-এ লাইভ আছে। ডোমেইনটি কানেক্ট করতে:
১. আপনার ফোনের ব্রাউজার থেকে `vercel.com` এ লগইন করুন।
২. আপনার প্রজেক্টটি সিলেক্ট করে **Settings > Domains** এ যান।
৩. `pabna-mart.shop` লিখে **Add** বাটনে ক্লিক করুন।
৪. Vercel আপনাকে দুটি **Nameservers** দিবে (যেমন: `ns1.vercel-dns.com`)। এগুলো কপি করুন।
৫. আপনার ডোমেইন প্যানেলে (`shodns.in`) লগইন করে Nameservers পরিবর্তন করে Vercel-এর দেওয়া নামগুলো বসিয়ে দিন।

### ২. কেনা হোস্টিং (cPanel) ব্যবহার করা
আপনি যদি কেনা ৫ জিবি হোস্টিংয়ে ওয়েবসাইটটি শিফট করতে চান:
১. **cPanel লগইন**: আপনার দেওয়া লিংকে গিয়ে ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।
২. **Node.js App**: cPanel-এ "Setup Node.js App" অপশনে যান। 
৩. **Create Application**: সেখানে আপনার ডোমেইন সিলেক্ট করুন এবং "Application Startup File" হিসেবে `server.js` দিন।
৪. **Env Variables**: "Environment Variables" সেকশনে আপনার Firebase API Keys গুলো এক এক করে যোগ করুন।
৫. **Upload**: আপনার প্রোজেক্টটি বিল্ড করে `.next/standalone` ফোল্ডারের ফাইলগুলো cPanel-এর File Manager-এ আপলোড করুন।

---

## 🛠 Backend Configuration (Important)

If you see errors like "Server not configured" during checkout or admin tasks, it's because the Firebase Admin SDK needs a service account key.

### How to get your Service Account Key:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **PabnaMart**.
3. Click the gear icon (Project Settings) > **Service Accounts**.
4. Click **"Generate new private key"**.
5. A JSON file will download. Open it and copy everything.
6. In your project's **Environment Variables** (in Vercel or cPanel), add a new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** (Paste the entire JSON content here)

---

## 📜 Pricing & Rounding Policy
To ensure clarity in pricing, all final product prices are rounded:
- If the decimal part is **> 0.55**, the price is rounded **UP** (e.g., ৳100.56 -> ৳101).
- If the decimal part is **<= 0.55**, the price is rounded **DOWN** (e.g., ৳100.55 -> ৳100).


# পাবনা মার্ট - মোবাইল দিয়ে ওয়েবসাইট লাইভ করার গাইড 🚀

আপনার কাছে কম্পিউটার না থাকলেও আপনি আপনার ফোন দিয়ে এই ওয়েবসাইটটি লাইভ করতে পারবেন। নিচে ধাপগুলো অনুসরণ করুন:

### ধাপ ১: GitHub অ্যাকাউন্ট তৈরি করুন
১. আপনার ফোনের ব্রাউজার থেকে [github.com](https://github.com) এ যান।
২. একটি ফ্রি অ্যাকাউন্ট খুলুন (যদি না থাকে)।
৩. একটি নতুন **Repository** তৈরি করুন যার নাম দিন `pabna-mart` এবং এটি `Private` রাখুন।

### ধাপ ২: কোড আপলোড করুন
১. এই এডিটরে (Firebase Studio) আপনি আপনার কোডটি সরাসরি GitHub-এ পুশ করার অপশন পাবেন। সেটি ব্যবহার করে আপনার তৈরি করা Repository-তে কোড পাঠিয়ে দিন।

### ধাপ ৩: Vercel-এ অ্যাকাউন্ট খুলুন
১. [vercel.com](https://vercel.com) এ যান এবং আপনার **GitHub** অ্যাকাউন্ট দিয়ে লগইন করুন।
২. **Add New Project** এ ক্লিক করুন।
৩. GitHub থেকে আপনার `pabna-mart` রিপোজিটরি সিলেক্ট করুন।

### ধাপ ৪: Environment Variables সেট করা (খুবই গুরুত্বপূর্ণ)
Vercel-এ প্রোজেক্ট ইমপোর্ট করার সময় **Environment Variables** সেকশনে নিচের তথ্যগুলো দিন (আপনার Firebase কনফিগারেশন থেকে):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (আপনার Firebase কনসোল থেকে ডাউনলোড করা পুরো JSON টেক্সটটি এখানে পেস্ট করুন)

এরপর **Deploy** বাটনে ক্লিক করুন। কিছুক্ষণ পর আপনার ওয়েবসাইটটি একটি অস্থায়ী লিংকে লাইভ হয়ে যাবে।

### ধাপ ৫: আপনার ডোমেইন (`pabna-mart.shop`) কানেক্ট করা
১. Vercel ড্যাশবোর্ডে গিয়ে আপনার প্রোজেক্টের **Settings > Domains** এ যান।
২. আপনার ডোমেইন নাম `pabna-mart.shop` লিখুন এবং **Add** দিন।
৩. Vercel আপনাকে কিছু **DNS Records** (A record এবং CNAME) দিবে।
৪. আপনার ডোমেইন যেখান থেকে কিনেছেন (যেমন shodns.in), তাদের ক্লায়েন্ট এরিয়ায় গিয়ে **DNS Management** বা **Nameservers** অপশনে যান।
৫. Vercel-এর দেওয়া তথ্য অনুযায়ী DNS রেকর্ডগুলো আপডেট করে দিন।
৬. সর্বোচ্চ ২৪ ঘণ্টার মধ্যে আপনার ডোমেইনে ওয়েবসাইটটি চালু হয়ে যাবে।

---
**নোট:** আপনার কেনা cPanel হোস্টিংটি আপনি শুধুমাত্র অফিসিয়াল ইমেইল (যেমন: info@pabna-mart.shop) তৈরি করার জন্য ব্যবহার করতে পারেন। ওয়েবসাইটটি Vercel-এ থাকাই আপনার জন্য সবচেয়ে ভালো হবে কারণ এতে কোড ম্যানেজ করা সহজ।

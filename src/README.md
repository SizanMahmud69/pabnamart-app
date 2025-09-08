# PabnaMart E-commerce App

This is a Next.js e-commerce application built with Firebase.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment Guide

Follow these steps to deploy your application to Vercel using GitHub.

### Step 1: Push to GitHub

1.  **Initialize Git in Your Local Project:**
    Open a terminal in your project's root directory and run the following commands:
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit"
    ```

2.  **Create a New GitHub Repository:**
    Go to your GitHub account and create a new repository. Do not initialize it with a `README.md` file.

3.  **Connect to Your GitHub Repository:**
    Copy the URL of the repository you created on GitHub and run the following command, replacing `your-repo-url` with your actual repository URL:
    ```bash
    git remote add origin your-repo-url
    ```

4.  **Push Your Code:**
    Upload your code to the GitHub repository with this command:
    ```bash
    git push -u origin main
    ```

### Step 2: Deploy to Vercel

1.  **Sign Up for Vercel:**
    Go to [vercel.com/signup](https://vercel.com/signup) and create an account using your GitHub profile.

2.  **Create a New Project:**
    - From your Vercel dashboard, click "Add New..." and select "Project".
    - Import the GitHub repository you just created.

3.  **Configure Environment Variables (Crucial Step):**
    - In the project configuration screen, find the "Environment Variables" section.
    - You need to add your Firebase project credentials here. These keys ensure your deployed application can connect to your Firebase services securely.

    **Required Environment Variables:**
    
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`: `AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `pabnamart.firebaseapp.com`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `pabnamart`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `pabnamart.firebasestorage.app`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: `600614180848`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`: `1:600614180848:web:6f4e21fb4f5b6cd42a6f35`
    
    **Admin SDK Variables (for server actions):**
    
    To get the values for the next two variables, go to your **Firebase Project Settings > Service accounts**, and generate a new private key.
    
    *   `FIREBASE_CLIENT_EMAIL`: Your Firebase service account's client email.
    *   `FIREBASE_PRIVATE_KEY`: Your Firebase service account's private key.

4.  **Deploy:**
    - After adding the environment variables, click the "Deploy" button.
    - Vercel will automatically build and deploy your application. Once finished, you will be provided with a live URL.

That's it! Your application is now live on Vercel.

# PabnaMart E-commerce App

This is a Next.js e-commerce application built with Firebase.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment Guide

### Important Note on GitHub Authentication

If you see an error like `fatal: Authentication failed` or `Invalid username or token` when running `git push`, it's because GitHub no longer accepts passwords for command-line Git operations. You must use a **Personal Access Token (PAT)** instead.

**How to fix this:**

1.  **Create a Personal Access Token:**
    *   Go to your GitHub settings: [github.com/settings/tokens](https://github.com/settings/tokens).
    *   Click **"Generate new token"** and select **"Generate new token (classic)"**.
    *   Give your token a name (e.g., "PabnaMart-Dev").
    *   Set an expiration date.
    *   Under **"Select scopes,"** check the box next to **`repo`**. This gives the token permission to access your repositories.
    *   Click **"Generate token"** at the bottom.

2.  **Copy Your New Token:**
    *   **This is very important:** Copy the token immediately. You won't be able to see it again. Save it in a secure place.

3.  **Use the Token to Push:**
    *   When you run `git push`, the terminal will ask for your username and password.
    *   **Username:** Enter your GitHub username.
    *   **Password:** Paste your new **Personal Access Token**.

After you authenticate successfully, your computer should save the token for future use.

---

Follow these steps to deploy your application to Vercel using GitHub.

### Step 1: Push to GitHub for the First Time

1.  **Create a New GitHub Repository:**
    Go to your GitHub account and create a new repository. **Do not** initialize it with a `README.md` or any other files.

2.  **Initialize Git in Your Local Project:**
    Open a terminal in your project's root directory and run the following commands one by one:
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit"
    ```

3.  **Connect to Your GitHub Repository:**
    Run the following command, replacing `<your-repo-url>` with your actual repository URL from GitHub.
    ```bash
    git remote add origin <your-repo-url>
    ```
    *Example: `git remote add origin https://github.com/your-username/pabnamart-app.git`*
    
    **If you see an error `remote origin already exists`**, it means a remote is already configured. You can fix it by running:
    ```bash
    git remote set-url origin <your-repo-url>
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

    **Firebase Public Variables:**
    
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`: `AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `pabnamart.firebaseapp.com`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `pabnamart`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `pabnamart.appspot.com`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: `600614180848`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`: `1:600614180848:web:6f4e21fb4f5b6cd42a6f35`
    
    **Firebase Admin SDK Variables (for server actions):**
    
    To get the values for the next two variables, go to your **Firebase Project Settings > Service accounts**, and generate a new private key. This will download a JSON file.
    
    *   `FIREBASE_CLIENT_EMAIL`: Your Firebase service account's `client_email` from the downloaded file.
    *   `FIREBASE_PRIVATE_KEY`: Your Firebase service account's `private_key` from the downloaded file.

    **Vercel Blob Storage (for image uploads - VERY IMPORTANT):**

    1.  Go to your Vercel project's dashboard.
    2.  Click on the **Storage** tab from the top menu.
    3.  Create a new **Blob** store by clicking the "Create Database" button and selecting "Blob". Follow the on-screen instructions.
    4.  After creation, Vercel will show you the store details. Go to the **.env.local** tab. Vercel will provide a `BLOB_READ_WRITE_TOKEN`. **Copy this token value.**
    5.  Now, go back to your project's **Settings** tab.
    6.  Click on **Environment Variables** from the left-side menu.
    7.  Add a new environment variable:
        -   **Name:** `BLOB_READ_WRITE_TOKEN`
        -   **Value:** Paste the token you copied in step 4.
    8.  Click **Save**.

4.  **Deploy:**
    - After adding all the environment variables, click the "Deploy" button.
    - Vercel will automatically build and deploy your application. Once finished, you will be provided with a live URL.
    - **Important:** If your deployment fails after adding the token, go to the "Deployments" tab in Vercel and redeploy the latest version.

### Step 3: Pushing Future Changes

After making any changes to your app, you need to push them to GitHub to update your live site. Open a terminal in your project and run these three commands:

1.  **Stage your changes:**
    ```bash
    git add .
    ```

2.  **Commit your changes with a message:**
    ```bash
    git commit -m "Describe your changes here"
    ```
    *Example: `git commit -m "Updated homepage design"`*

3.  **Push the changes to GitHub:**
    ```bash
    git push
    ```

That's it! Vercel will automatically detect the push and redeploy your website with the latest changes.

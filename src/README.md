
# PabnaMart E-commerce App

This is a Next.js e-commerce application built with Firebase.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment Guide for Vercel

Follow these simple steps to deploy your application to Vercel.

### Step 1: Push Your Code to GitHub

First, you need to have your project on GitHub.

1.  **Create a New GitHub Repository:**
    Go to your GitHub account and create a new, empty repository.

2.  **Connect Your Project to GitHub:**
    In your project's terminal, run these commands one by one:
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit"
    git remote add origin <your-repo-url>
    git push -u origin main
    ```
    *(Replace `<your-repo-url>` with your new repository's URL)*

### Step 2: Deploy to Vercel & Set Environment Variables

This is the most important step. Vercel needs access to your Firebase and other services to work correctly.

1.  **Sign Up & Import Project:**
    - Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
    - From your dashboard, click **"Add New..."** -> **"Project"**.
    - Import the GitHub repository you just created.

2.  **Add Public Firebase Variables:**
    - In Vercel's "Configure Project" screen, find the **Environment Variables** section.
    - Add the following variables one by one. The **Name** and **Value** must be exact.

    | Name                                      | Value                                          |
    | ----------------------------------------- | ---------------------------------------------- |
    | `NEXT_PUBLIC_FIREBASE_API_KEY`            | `AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk`        |
    | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`        | `pabnamart.firebaseapp.com`                    |
    | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`         | `pabnamart`                                    |
    | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`     | `pabnamart.appspot.com`                        |
    | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| `600614180848`                                 |
    | `NEXT_PUBLIC_FIREBASE_APP_ID`             | `1:600614180848:web:6f4e21fb4f5b6cd42a6f35`   |

3.  **Add Firebase Service Account (CRITICAL):**
    This allows your server to perform actions like placing orders.

    - In your [Firebase project settings](https://console.firebase.google.com/u/0/project/pabnamart/settings/serviceaccounts/adminsdk), click **"Generate new private key"**. A JSON file will download.
    - Open the downloaded JSON file with a simple text editor (like Notepad on Windows or TextEdit on Mac).
    - **CRITICAL:** Select **ALL** the text in the file (`Ctrl+A` or `Cmd+A`) and copy it (`Ctrl+C` or `Cmd+C`). The text must start with `{` and end with `}`. Do not miss anything.
    - In Vercel, add a **new** environment variable:
        - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
        - **Value:** Paste the **entire JSON content** you just copied. Ensure there are no extra spaces or line breaks before or after what you paste.
    - **IMPORTANT:** Make sure all three environment boxes (Production, Preview, Development) are checked for this variable.

4.  **Add Vercel Blob Storage Token (for Image Uploads):**

    - In your Vercel dashboard, go to the **Storage** tab and create a new **Blob** store.
    - Vercel will give you a token named `BLOB_READ_WRITE_TOKEN`. Copy the value.
    - In Vercel, add another new environment variable:
        - **Name:** `BLOB_READ_WRITE_TOKEN`
        - **Value:** Paste the token value.
    - Again, make sure all three environment boxes are checked.

5.  **Deploy:**
    - Click the **"Deploy"** button.
    - If the deployment fails, go to the **"Deployments"** tab and redeploy the latest version to apply the environment variable changes.

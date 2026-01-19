
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

If you see an error like `fatal: Authentication failed` when running `git push`, it's because GitHub no longer accepts passwords for command-line Git operations. You must use a **Personal Access Token (PAT)** instead.

#### How to Create a Personal Access Token (PAT)

1.  **Go to GitHub Token Settings:**
    *   Log into your GitHub account and navigate to [github.com/settings/tokens](https://github.com/settings/tokens).

2.  **Generate a New Token:**
    *   Click **"Generate new token"** and select **"Generate new token (classic)"**.

3.  **Configure the Token:**
    *   **Note:** Give your token a descriptive name (e.g., "PabnaMart-Dev").
    *   **Expiration:** Set an expiration date (e.g., 30 or 90 days is recommended).
    *   **Select scopes:** Check the box next to **`repo`**. This is the only permission needed to push code.

4.  **Generate and Copy:**
    *   Click **"Generate token"** at the bottom.
    *   **VERY IMPORTANT:** Copy the token immediately. **You will not see it again.** Save it somewhere safe, like a password manager.

#### How to Use Your Token

After creating your token, run `git push`. What happens next depends on your system's configuration.

**Scenario 1: Git asks for your username and password**

This is the ideal case. When prompted:
*   **Username:** Enter your GitHub username.
*   **Password:** Paste your new **Personal Access Token**.

**Scenario 2: Git fails without asking for a password**

If `git push` gives an authentication error immediately without asking for a username or password, it means your computer has cached old, incorrect credentials.

You can try to force Git to ask again by updating your repository's remote URL. Follow these steps:

1.  **Open a terminal** in your project's root directory.

2.  **Run the following command.** Make sure to replace `<your-repo-url>` with your actual repository URL from GitHub.
    ```bash
    git remote set-url origin <your-repo-url>
    ```
    *You can find your repository URL on its main page on GitHub. It looks like `https://github.com/your-username/your-repo-name.git`.*

3.  **Now, run `git push` again:**
    ```bash
    git push
    ```

4.  This time, it should ask for your **username** and **password**. Use your **Personal Access Token (PAT)** for the password.

---

### **Still Not Working? Manually Clear Your Credentials**

If `git push` still fails without asking for a password, it means your Operating System's credential manager has stored the old password and is using it automatically. You need to remove it manually.

#### **For Windows Users:**

1.  **Open Credential Manager:** Press the **Windows key**, type "Credential Manager", and press Enter.
2.  **Select Windows Credentials:** Click on the "Windows Credentials" button.
3.  **Find the GitHub Credential:** Look for an entry named `git:https://github.com` in the list.
4.  **Remove it:** Click on the credential to expand it, and then click the **"Remove"** link.

![Windows Credential Manager](https://i.ibb.co/6yv9Y3p/win-cred.png)

#### **For macOS Users:**

1.  **Open Keychain Access:** Open "Finder", go to "Applications" -> "Utilities", and open "Keychain Access".
2.  **Search for GitHub:** In the search bar at the top-right of the Keychain Access window, type `github.com`.
3.  **Find the Credential:** Look for an "internet password" entry that shows `github.com`.
4.  **Delete it:** Right-click on that entry and select **"Delete [name of entry]"**.

![macOS Keychain Access](https://i.ibb.co/yBNt8xW/mac-key.png)

### **Final Step: Push Again**

After you have cleared the cached credentials from your system, go back to your terminal and run `git push` one more time.

```bash
git push
```

This time, it is **guaranteed** to ask for your username and password. Use your **Personal Access Token (PAT)** for the password, and your code will be pushed successfully.

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
    
    **Firebase Admin SDK Variable (for server actions):**

    To get the value for the next variable, you'll need to generate a service account key from Firebase.

    1.  In your Firebase project, go to **Project Settings** (click the gear icon) > **Service accounts**.
    2.  Click **"Generate new private key"**. A JSON file will be downloaded to your computer.
    3.  Open this JSON file with a text editor and **copy its entire content**.
    4.  Now, go to your Vercel project's **Settings** > **Environment Variables**.
    5.  Add a new environment variable:
        -   **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
        -   **Value:** Paste the entire JSON content you copied in step 3.
    6.  Click **Save**. Make sure to redeploy your project for the changes to take effect.


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

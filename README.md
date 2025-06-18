# LinkedIn Personal Branding Assistant

The LinkedIn Personal Branding Assistant helps users define their LinkedIn profile context and uses the Google Gemini API to generate engaging posts with relevant hashtags, aiding them in building their personal brand effectively.

## Features

-   **Profile Context Management:** Save and load your LinkedIn profile details.
-   **AI-Powered Post Generation:** Generate engaging LinkedIn post drafts.
-   **Hashtag Suggestions:** Get relevant hashtags for your posts.
-   **AI-Powered Image Generation:** Generate relevant images based on post content.
-   **Image Download & Copy:** Save or copy generated images.
-   **Search Grounding:** Utilizes Google Search for potentially more current and relevant post content, with source attribution.
-   **Copy to Clipboard:** Easily copy generated post text and hashtags.
-   **Flexible API Key Handling:** Supports API key via environment variables, local config file, or user input.
-   **Responsive Design:** Works across different screen sizes.
-   **Offline Profile Storage:** Profile context is saved in browser localStorage.

## Tech Stack

-   HTML5
-   CSS3
-   TypeScript
-   Google Gemini API (`@google/genai`)
-   ES Modules with `importmap`

## Prerequisites

-   A modern web browser.
-   A Google Gemini API Key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   Node.js and npm (or yarn) are recommended for a local development server, though not strictly required if you have another way to serve static files.

## API Key Management

The application uses the following priority order to obtain the Google Gemini API Key:

1.  **Session Storage (User Input):** If you've previously entered an API key via the in-app prompt during the current browser session, that key will be used. This is stored in `sessionStorage` and is cleared when the session ends (e.g., browser tab closed).
2.  **Environment Configuration (`env-config.js` or Deployed Environment Variable):**
    *   **Local Development:** The app looks for `window.process.env.API_KEY` which can be set by the `env-config.js` file (see "Local Development Setup" below).
    *   **Deployed Environment:** For cloud deployments, this `API_KEY` should be set as a true environment variable by your hosting provider (see "Deploying to the Cloud" below).
3.  **In-App Prompt:** If a valid API key is not found through the methods above, or if an API call fails due to an invalid key, the application will display a modal prompting you to enter your API key directly.

## Local Development Setup

Follow these steps to run the application locally:

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone https://github.com/amarsinghrathour/linkedin-crafter
    cd linkedin-crafter
    ```

2.  **Configure API Key (Optional but Recommended for Local Dev):**
    While the app can now prompt you for a key, for smoother local development, you can use `env-config.js`.

    *   **Create `env-config.js`:**
        In the root directory of the project (i.e., next to `index.html`), create a new file named `env-config.js`.

    *   **Add API Key to `env-config.js`:**
        Copy and paste the following content into `env-config.js`:
        ```javascript
        // env-config.js
        // IMPORTANT: DO NOT COMMIT THIS FILE TO VERSION CONTROL if it contains your actual API key.
        // This file is for local development convenience ONLY.

        const LOCAL_DEV_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

        if (typeof window.process === 'undefined') {
          window.process = { env: {} };
        } else if (typeof window.process.env === 'undefined') {
          window.process.env = {};
        }

        if (LOCAL_DEV_API_KEY && LOCAL_DEV_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
          if (!window.process.env.API_KEY) {
            window.process.env.API_KEY = LOCAL_DEV_API_KEY;
            console.info("Local development API_KEY loaded from env-config.js.");
          } else {
            console.info("API_KEY already set in process.env (e.g., by hosting), env-config.js did not overwrite.");
          }
        } else if (!window.process.env.API_KEY) {
          if (!LOCAL_DEV_API_KEY || LOCAL_DEV_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            console.warn(
              "API_KEY not set in env-config.js or is placeholder. The application may prompt for an API key if not set by other means."
            );
          }
        }
        ```
        **Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual API key.**

    *   **`.gitignore` an `env-config.js`:**
        The included `.gitignore` file is configured to ignore `env-config.js`. **Ensure this file is never committed if it contains your real API key.**

3.  **Serve the Application:**
    You need a local HTTP server.
    *   **Using `npx http-server` (requires Node.js):**
        ```bash
        npx http-server
        ```
        Typically serves at `http://localhost:8080`.
    *   **Using Python's built-in server (Python 3):**
        ```bash
        python -m http.server
        ```
        Typically serves at `http://localhost:8000`.

4.  **Open in Browser:**
    Open the URL from your local server. If the API key is not found via `env-config.js` or environment variables, the app will prompt you for it.

## Using the Application

1.  **API Key:** If prompted, enter your Google Gemini API Key.
2.  **Enter Profile Context:** Fill in your details and click "Save Profile Context".
3.  **Generate Post & Image:** Click "Generate Engaging Post". The AI will generate post text, hashtags, and an image idea.
4.  **Generate Image:** Click "Generate Image" to create a visual based on the idea.
5.  **Review, Copy, Download:** Review the content. Use buttons to copy text/hashtags, or download/copy the image.
6.  **Attributions:** Source links may appear if web search was used.

## Deploying to the Cloud

This is a static website and can be deployed to various static site hosting providers.

1.  **Choose a Hosting Provider:** Netlify, Vercel, GitHub Pages, Firebase Hosting, AWS S3, etc.

2.  **Configure Environment Variable (`API_KEY`):**
    **Crucial for deployment.**
    *   **DO NOT** deploy `env-config.js` or hardcode your API key.
    *   Set the `API_KEY` as an environment variable in your hosting provider's settings.
    *   **Netlify:** Site settings > Build & deploy > Environment > Environment variables.
    *   **Vercel:** Project Settings > Environment Variables.
    *   Variable name: `API_KEY`, value: your Google Gemini API Key.

3.  **Deployment Process:**
    *   Upload `index.html`, `index.css`, `index.tsx`, `metadata.json`, and `LICENSE`. Do not include `env-config.js`.
    *   The `<script src="env-config.js"></script>` in `index.html` will result in a 404 error in the deployed version (which is fine and expected if `env-config.js` is not deployed). The application will then rely on the platform-set `API_KEY` or prompt the user.

## Important Security Considerations for API Key

-   **Never commit your API key directly into your source code.**
-   `env-config.js` is for local convenience only; always keep it in `.gitignore`.
-   For deployed environments, **always** use environment variables set through your hosting provider.
-   Keys entered into the app's prompt are stored in `sessionStorage` and are cleared when the browser session ends. They are not persistently stored by the application beyond the session.
-   Be mindful of API key usage and quotas on the Google Gemini platform.

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for the full license text.

Copyright 2024 Amar Singh Rathour ([https://www.linkedin.com/in/amar-singh-rathour/](https://www.linkedin.com/in/amar-singh-rathour/))

You may use, redistribute, and modify this software in accordance with the terms of the Apache License 2.0. While the license itself outlines attribution requirements (primarily retaining copyright notices), if you find this project useful, a friendly acknowledgement or link back to Amar Singh Rathour's LinkedIn profile would be appreciated.
// env-config.js
// IMPORTANT: DO NOT COMMIT THIS FILE TO VERSION CONTROL if it contains your actual API key.
// This file is for local development convenience ONLY.
// In a production/CI/CD environment, API_KEY should be set as a true environment variable.

// Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Google Gemini API Key for local testing.
const LOCAL_DEV_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// Polyfill process.env if it doesn't exist (common in browser environments)
if (typeof window.process === 'undefined') {
  window.process = { env: {} };
} else if (typeof window.process.env === 'undefined') {
  window.process.env = {};
}

// Only set the API_KEY if it's a valid key (not the placeholder) 
// AND if process.env.API_KEY is not already set by some other means (e.g., hosting platform).
if (LOCAL_DEV_API_KEY && LOCAL_DEV_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
  if (!window.process.env.API_KEY) { // Check if not already set (e.g., by hosting platform)
    window.process.env.API_KEY = LOCAL_DEV_API_KEY;
    console.info("Local development API_KEY loaded from env-config.js.");
  } else {
    console.info("API_KEY already set in process.env (e.g., by hosting platform), env-config.js did not overwrite.");
  }
} else if (!window.process.env.API_KEY) {
  // Only warn if API_KEY isn't set by any means AND the local key is still the placeholder or empty.
  if (!LOCAL_DEV_API_KEY || LOCAL_DEV_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.warn(
      "API_KEY not set in env-config.js or is placeholder. " +
      "The application may prompt for an API key if not set by other means (e.g., hosting platform environment variables)."
    );
  }
}
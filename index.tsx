// Copyright 2024 Amar Singh Rathour (https://www.linkedin.com/in/amar-singh-rathour/)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";

interface ProfileData {
    fullName: string;
    headline: string;
    niche: string;
    industry: string;
    targetAudience: string;
    linkedinGoal: string;
}

// Global AI instance, initialized after key validation
let ai: GoogleGenAI | null = null;

document.addEventListener('DOMContentLoaded', () => {
    // API Key Modal Elements
    const apiKeyModal = document.getElementById('apiKeyModal') as HTMLDivElement;
    const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
    const saveApiKeyButton = document.getElementById('saveApiKeyButton') as HTMLButtonElement;
    const apiKeyStatus = document.getElementById('apiKeyStatus') as HTMLDivElement;

    // Profile Form Elements
    const profileForm = document.getElementById('profileForm') as HTMLFormElement;
    const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
    const submitButton = document.getElementById('submitButton') as HTMLButtonElement;

    // Post Generation Elements
    const generatePostButton = document.getElementById('generatePostButton') as HTMLButtonElement;
    const postGenerationStatus = document.getElementById('postGenerationStatus') as HTMLDivElement;
    const generatedPostArea = document.getElementById('generatedPostArea') as HTMLDivElement;
    const postTextElement = document.getElementById('postText') as HTMLPreElement;
    const hashtagsTextElement = document.getElementById('hashtagsText') as HTMLParagraphElement;
    const attributionsDisplay = document.getElementById('attributionsDisplay') as HTMLDivElement;
    const attributionsList = document.getElementById('attributionsList') as HTMLUListElement;
    const copyPostButton = document.getElementById('copyPostButton') as HTMLButtonElement;
    const copyStatus = document.getElementById('copyStatus') as HTMLSpanElement;

    // Image Generation Elements
    const imageIdeaSection = document.getElementById('imageIdeaSection') as HTMLDivElement;
    const imagePromptTextElement = document.getElementById('imagePromptText') as HTMLParagraphElement;
    const generateImageButton = document.getElementById('generateImageButton') as HTMLButtonElement;
    const imageGenerationStatus = document.getElementById('imageGenerationStatus') as HTMLDivElement;
    const generatedImageDisplay = document.getElementById('generatedImageDisplay') as HTMLDivElement;
    const generatedImageElement = document.getElementById('generatedImage') as HTMLImageElement;

    // Image Action Elements
    const imageActions = document.getElementById('imageActions') as HTMLDivElement;
    const downloadImageButton = document.getElementById('downloadImageButton') as HTMLButtonElement;
    const copyImageButton = document.getElementById('copyImageButton') as HTMLButtonElement;
    const imageActionStatus = document.getElementById('imageActionStatus') as HTMLDivElement;

    let currentImagePrompt: string | null = null;

    function setSubmitButtonText(isUpdate: boolean) {
        if (submitButton) {
            submitButton.textContent = isUpdate ? 'Update Profile Context' : 'Save Profile Context';
        }
    }

    function updateAllButtonStates() {
        const isAiReady = ai !== null;
        const profileDataSaved = !!localStorage.getItem('linkedinProfileContext');

        if (generatePostButton) {
            generatePostButton.disabled = !isAiReady || !profileDataSaved;
            if (!isAiReady) {
                generatePostButton.title = "AI features disabled. API Key may be missing or invalid.";
                if (postGenerationStatus && postGenerationStatus.className !== 'error' && postGenerationStatus.className !== 'loading' && postGenerationStatus.className !== 'success') {
                    postGenerationStatus.textContent = 'API Key required to generate posts.';
                    postGenerationStatus.className = 'info';
                }
            } else if (!profileDataSaved) {
                generatePostButton.title = "Save profile context to enable post generation.";
                if (postGenerationStatus && postGenerationStatus.className !== 'error' && postGenerationStatus.className !== 'loading' && postGenerationStatus.className !== 'success') {
                     if(!postGenerationStatus.textContent?.includes('API Key required')) { 
                        postGenerationStatus.textContent = 'Please save your profile context first to enable post generation.';
                        postGenerationStatus.className = 'info';
                     }
                }
            } else {
                generatePostButton.title = "Generate an engaging LinkedIn post.";
                if (postGenerationStatus && postGenerationStatus.className === 'info' &&
                    (postGenerationStatus.textContent?.includes('API Key required') || postGenerationStatus.textContent?.includes('Please save your profile context'))) {
                    postGenerationStatus.textContent = '';
                    postGenerationStatus.className = '';
                }
            }
        }

        if (generateImageButton) {
            generateImageButton.disabled = !isAiReady || !currentImagePrompt; // Also disable if no prompt
            if(!isAiReady) generateImageButton.title = "AI features disabled. API Key may be missing or invalid.";
            else if (!currentImagePrompt) generateImageButton.title = "Generate text post first to get an image idea.";
            else generateImageButton.title = "Generate image based on suggestion";
        }
        
        if (downloadImageButton) downloadImageButton.disabled = !isAiReady || generatedImageElement.src === '#' || !generatedImageElement.src.startsWith('data:image');
        if (copyImageButton) copyImageButton.disabled = !isAiReady || generatedImageElement.src === '#' || !generatedImageElement.src.startsWith('data:image');
    }

    async function tryInitializeAi(key: string | null | undefined): Promise<boolean> {
        if (!key || key === "YOUR_GEMINI_API_KEY_HERE") {
            return false;
        }
        try {
            const testAiInstance = new GoogleGenAI({ apiKey: key });
            ai = testAiInstance;
            sessionStorage.setItem('userProvidedApiKey', key);
            console.info("GoogleGenAI client initialized with key.");
            if (apiKeyModal) apiKeyModal.style.display = 'none';
            if (apiKeyStatus) {
                apiKeyStatus.textContent = ''; // Clear any previous modal status
                apiKeyStatus.className = '';
            }
            updateAllButtonStates();
            return true;
        } catch (error) {
            console.error("Failed to initialize GoogleGenAI with key:", key, error);
            ai = null;
            sessionStorage.removeItem('userProvidedApiKey');
            updateAllButtonStates();
            return false;
        }
    }

    async function requestApiKeyFromUser() {
        console.warn("API Key not available or invalid. Prompting user.");
        if (apiKeyModal) apiKeyModal.style.display = 'flex';
        ai = null; // Ensure AI is null if we are prompting
        updateAllButtonStates(); // This will disable AI features and show relevant messages
    }

    async function initializeApp() {
        let apiKeyFoundAndValid = false;
        const sessionKey = sessionStorage.getItem('userProvidedApiKey');
        if (sessionKey) {
            console.log("Attempting to initialize AI with key from session storage.");
            if (await tryInitializeAi(sessionKey)) {
                apiKeyFoundAndValid = true;
            } else {
                sessionStorage.removeItem('userProvidedApiKey');
            }
        }

        if (!apiKeyFoundAndValid) {
            const envApiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
            if (envApiKey && envApiKey !== "YOUR_GEMINI_API_KEY_HERE") {
                console.log("Attempting to initialize AI with key from process.env.");
                if (await tryInitializeAi(envApiKey)) {
                    apiKeyFoundAndValid = true;
                }
            }
        }

        if (!apiKeyFoundAndValid) {
            await requestApiKeyFromUser();
        }
        updateAllButtonStates(); // Final call to set initial states correctly
    }
    
    initializeApp();


    if (saveApiKeyButton && apiKeyInput && apiKeyModal && apiKeyStatus) {
        saveApiKeyButton.addEventListener('click', async () => {
            const userKey = apiKeyInput.value.trim();
            if (!userKey) {
                apiKeyStatus.textContent = 'Please enter an API Key.';
                apiKeyStatus.className = 'error';
                return;
            }
            saveApiKeyButton.disabled = true;
            saveApiKeyButton.textContent = 'Validating...';
            apiKeyStatus.textContent = 'Validating API Key...';
            apiKeyStatus.className = 'loading';

            if (await tryInitializeAi(userKey)) {
                apiKeyStatus.textContent = 'API Key saved and validated for this session!';
                apiKeyStatus.className = 'success';
                setTimeout(() => {
                    if (apiKeyModal.style.display !== 'none') { // only hide if it was due to this action
                         apiKeyModal.style.display = 'none';
                    }
                    apiKeyStatus.textContent = ''; // Clear status after a bit
                    apiKeyStatus.className = '';
                }, 2000);
            } else {
                apiKeyStatus.textContent = 'Invalid API Key or failed to initialize. Please check the key and try again.';
                apiKeyStatus.className = 'error';
            }
            saveApiKeyButton.disabled = false;
            saveApiKeyButton.textContent = 'Save & Use API Key';
            updateAllButtonStates();
        });
    }


    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!submitButton || !statusMessage) return;

            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
            statusMessage.textContent = 'Saving profile context...';
            statusMessage.className = 'loading';

            setTimeout(() => {
                const formData = new FormData(profileForm);
                const profileData: ProfileData = {
                    fullName: formData.get('fullName') as string,
                    headline: formData.get('headline') as string,
                    niche: formData.get('niche') as string,
                    industry: formData.get('industry') as string,
                    targetAudience: formData.get('targetAudience') as string,
                    linkedinGoal: formData.get('linkedinGoal') as string,
                };

                try {
                    localStorage.setItem('linkedinProfileContext', JSON.stringify(profileData));
                    statusMessage.textContent = 'Profile context saved successfully!';
                    statusMessage.className = 'success';
                    setSubmitButtonText(true);
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                    statusMessage.textContent = 'Error saving profile. Please try again.';
                    statusMessage.className = 'error';
                }
                updateAllButtonStates();
                submitButton.disabled = false;
                
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = '';
                }, 3000);
            }, 500);
        });
    }

    if (statusMessage) {
        try {
            const savedData = localStorage.getItem('linkedinProfileContext');
            if (savedData) {
                const parsedData: ProfileData = JSON.parse(savedData);
                (document.getElementById('fullName') as HTMLInputElement).value = parsedData.fullName || '';
                (document.getElementById('headline') as HTMLInputElement).value = parsedData.headline || '';
                (document.getElementById('niche') as HTMLInputElement).value = parsedData.niche || '';
                (document.getElementById('industry') as HTMLInputElement).value = parsedData.industry || '';
                (document.getElementById('targetAudience') as HTMLTextAreaElement).value = parsedData.targetAudience || '';
                (document.getElementById('linkedinGoal') as HTMLTextAreaElement).value = parsedData.linkedinGoal || '';

                statusMessage.textContent = 'Previously saved profile context loaded.';
                statusMessage.className = 'info';
                setSubmitButtonText(true);
                 setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = '';
                }, 3000);
            } else {
                setSubmitButtonText(false);
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            statusMessage.textContent = 'Could not load saved data.';
            statusMessage.className = 'error';
            setSubmitButtonText(false);
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = '';
            }, 3000);
        }
        updateAllButtonStates();
    }


    if (copyPostButton && postTextElement && hashtagsTextElement && copyStatus) {
        copyPostButton.addEventListener('click', async () => {
            const postText = postTextElement.textContent || '';
            const hashtagsText = hashtagsTextElement.textContent || '';
            let textToCopy = postText.trim();
            const trimmedHashtags = hashtagsText.trim();

            if (trimmedHashtags !== '') {
                textToCopy += `\n\n${trimmedHashtags}`;
            }

            if (!textToCopy) { 
                copyStatus.textContent = "Nothing to copy.";
                setTimeout(() => { copyStatus.textContent = ''; }, 2000);
                return;
            }

            try {
                await navigator.clipboard.writeText(textToCopy);
                copyStatus.textContent = 'Copied!';
                copyPostButton.textContent = 'Copied!';
                copyPostButton.disabled = true; 
                setTimeout(() => {
                    copyStatus.textContent = '';
                    copyPostButton.textContent = 'Copy Post Text';
                    copyPostButton.disabled = false;
                     updateAllButtonStates(); // Re-check button states
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                copyStatus.textContent = 'Copy failed!';
                 setTimeout(() => { copyStatus.textContent = ''; }, 2000);
            }
        });
    }

    if (generatePostButton) {
        generatePostButton.addEventListener('click', async () => {
            if (!ai) { 
                 postGenerationStatus.textContent = 'AI Service not initialized. Please provide a valid API Key.';
                 postGenerationStatus.className = 'error';
                 await requestApiKeyFromUser();
                 return;
            }

            const savedData = localStorage.getItem('linkedinProfileContext');
            if (!savedData) { 
                // This case should be handled by updateAllButtonStates disabling the button,
                // but as a fallback:
                postGenerationStatus.textContent = 'Please save your profile context first.';
                postGenerationStatus.className = 'error';
                setTimeout(() => {
                    if(postGenerationStatus.textContent === 'Please save your profile context first.') {
                        postGenerationStatus.textContent = '';
                        postGenerationStatus.className = '';
                    }
                }, 4000);
                return;
            }

            const profileData: ProfileData = JSON.parse(savedData);

            generatePostButton.disabled = true;
            generatePostButton.textContent = 'Generating...';
            postGenerationStatus.textContent = 'Generating LinkedIn post... Please wait.';
            postGenerationStatus.className = 'loading';
            generatedPostArea.style.display = 'none';
            if (imageIdeaSection) imageIdeaSection.style.display = 'none';
            if (generatedImageDisplay) generatedImageDisplay.style.display = 'none';
            if (generatedImageElement) generatedImageElement.src = '#';
            if (imageActions) imageActions.style.display = 'none';
            if (imageActionStatus) {
                imageActionStatus.textContent = '';
                imageActionStatus.className = '';
            }
            if (imageGenerationStatus) {
                imageGenerationStatus.textContent = '';
                imageGenerationStatus.className = '';
            }
            if (copyPostButton) copyPostButton.style.display = 'none';
            if (copyStatus) copyStatus.textContent = '';
            attributionsDisplay.style.display = 'none';
            attributionsList.innerHTML = '';
            currentImagePrompt = null; // Reset current image prompt

            const prompt = `
Based on the following LinkedIn profile context:
- Full Name: ${profileData.fullName}
- Headline/Role: ${profileData.headline}
- Niche: ${profileData.niche}
- Industry: ${profileData.industry}
- Target Audience: ${profileData.targetAudience}
- LinkedIn Goal: ${profileData.linkedinGoal}

Act as an experienced LinkedIn content strategist and SEO expert. Generate one engaging LinkedIn post draft and a related image idea.
The post should be designed to build personal brand, attract clients, and engage users within the specified niche and industry. The post should target the defined audience and align with their LinkedIn goals.

The post must be:
1. Engaging: Use a strong hook, provide clear value, and encourage interaction.
2. Relevant: Directly related to their niche, industry, and target audience.
3. SEO-friendly: Incorporate relevant keywords naturally.
4. Stylized & Formatted for LinkedIn:
   - Use emojis strategically (💡, 🚀, 🎯, 🚧, 📢, ✍️, 🧐).
   - Consider Unicode characters for stylizing main titles or important phrases if appropriate or use simple text emphasis like ALL CAPS or *asterisks*.
   - Structure content with clear headings or distinct sections.
   - Employ bullet points (e.g., ●, -, *, ✅) for lists.
   - Ensure appropriate spacing, paragraphs, and professional yet approachable tone.
5. Hashtags (Crucial): Provide 3-5 relevant and effective hashtags. These hashtags must ONLY appear in the designated HASHTAGS_START...HASHTAGS_END block below.
6. Current (if applicable): Utilize search capabilities for recent trends if it enhances relevance.

Image Idea:
Provide a concise, descriptive prompt for an image that visually represents the core message of the post. This prompt will be used for image generation.

Output Format:
Strictly adhere to the following format. Do not add any introductory or concluding sentences outside this structure.
The post content itself (within POST_TEXT_START...POST_TEXT_END) should NOT end with hashtags; all hashtags must be exclusively within the HASHTAGS_START...HASHTAGS_END block.

POST_TEXT_START
[Your engaging LinkedIn post content here. Make it shareable and valuable.
Incorporate stylistic elements as described above. Ensure the post concludes with a call to engagement or summary, NOT hashtags.]

Example Structure (adapt as needed):

🚀 [Catchy Title/Hook with Emojis] 🚀
[Intro/Context]
🚧 The Core Idea/Challenge:
[Description]
🧠 Key Insights/Solution:
   ● Insight 1: [Details]
   ● Insight 2: [Details]
🎯 The Takeaway/Call to Engagement:
[Summary and question/CTA. Do NOT place hashtags here.]
POST_TEXT_END

HASHTAGS_START
[#relevantHashtag1] [#nicheSpecificHashtag2] [#goalOrientedHashtag3] [#anotherHashtag4] [#finalHashtag5]
HASHTAGS_END

IMAGE_PROMPT_START
[A concise, descriptive prompt for an image that visually represents the core message of the post. For example: "A diverse team collaborating around a futuristic interface showing growth charts." or "Abstract representation of network connections and innovation."]
IMAGE_PROMPT_END
`;

            try {
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-preview-04-17',
                    contents: prompt,
                    config: {
                        tools: [{googleSearch: {}}],
                    }
                });

                const fullText = response.text;
                const postTextMatch = fullText.match(/POST_TEXT_START([\s\S]*?)POST_TEXT_END/);
                const hashtagsMatch = fullText.match(/HASHTAGS_START([\s\S]*?)HASHTAGS_END/);
                const imagePromptMatch = fullText.match(/IMAGE_PROMPT_START([\s\S]*?)IMAGE_PROMPT_END/);

                if (postTextMatch?.[1] && hashtagsMatch?.[1] && imagePromptMatch?.[1]) {
                    postTextElement.textContent = postTextMatch[1].trim();
                    hashtagsTextElement.textContent = hashtagsMatch[1].trim();
                    currentImagePrompt = imagePromptMatch[1].trim(); 
                    imagePromptTextElement.textContent = currentImagePrompt;
                    
                    generatedPostArea.style.display = 'block';
                    if (imageIdeaSection) imageIdeaSection.style.display = 'block';
                    if (generatedImageDisplay) generatedImageDisplay.style.display = 'none'; 
                    if (generatedImageElement) generatedImageElement.src = '#'; 
                    if (imageActions) imageActions.style.display = 'none';
                     if (imageGenerationStatus) {
                        imageGenerationStatus.textContent = '';
                        imageGenerationStatus.className = '';
                    }
                    if (copyPostButton) copyPostButton.style.display = 'inline-block'; 
                    postGenerationStatus.textContent = 'LinkedIn post and image idea generated successfully!';
                    postGenerationStatus.className = 'success';

                    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
                    if (groundingMetadata?.groundingChunks?.length) {
                        attributionsList.innerHTML = ''; 
                        groundingMetadata.groundingChunks.forEach(chunk => {
                            if (chunk.web?.uri) {
                                const listItem = document.createElement('li');
                                const link = document.createElement('a');
                                link.href = chunk.web.uri;
                                link.textContent = chunk.web.title || chunk.web.uri;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                listItem.appendChild(link);
                                attributionsList.appendChild(listItem);
                            }
                        });
                        if (attributionsList.children.length > 0) {
                             attributionsDisplay.style.display = 'block';
                        }
                    } else {
                        attributionsDisplay.style.display = 'none';
                    }
                } else {
                    console.error('Could not parse post, hashtags, or image prompt from response:', fullText);
                    postGenerationStatus.textContent = 'Error: Could not parse the generated content. Please try again.';
                    postGenerationStatus.className = 'error';
                    if (copyPostButton) copyPostButton.style.display = 'none';
                    if (imageIdeaSection) imageIdeaSection.style.display = 'none';
                }
            } catch (error) {
                console.error('Error generating post:', error);
                postGenerationStatus.textContent = 'An error occurred while generating the post. Please check the console.';
                postGenerationStatus.className = 'error';
                if (copyPostButton) copyPostButton.style.display = 'none';
                if (imageIdeaSection) imageIdeaSection.style.display = 'none';

                if (error instanceof Error) {
                    if (error.message.includes("API key not valid") || error.message.toLowerCase().includes("api_key_invalid") || error.message.includes("permission denied")) {
                        postGenerationStatus.textContent = 'Error: API Key is invalid or permission denied. Please provide a valid key.';
                        ai = null; 
                        sessionStorage.removeItem('userProvidedApiKey');
                        await requestApiKeyFromUser();
                    } else if (error.message.includes("quota")) {
                         postGenerationStatus.textContent = 'Error: API quota exceeded. Please try again later.';
                    }
                }
            } finally {
                generatePostButton.disabled = false; // Will be re-evaluated by updateAllButtonStates
                generatePostButton.textContent = 'Generate Engaging Post';
                updateAllButtonStates();
                if (postGenerationStatus.className === 'loading') {
                     setTimeout(() => {
                        postGenerationStatus.textContent = '';
                        postGenerationStatus.className = '';
                    }, 100); 
                } else {
                    setTimeout(() => {
                        if (postGenerationStatus.className !== 'error' && postGenerationStatus.className !== 'info') {
                             postGenerationStatus.textContent = '';
                             postGenerationStatus.className = '';
                        }
                    }, 7000); 
                }
            }
        });
    }

    if (generateImageButton) {
        generateImageButton.addEventListener('click', async () => {
            if (!ai || !currentImagePrompt) {
                imageGenerationStatus.textContent = 'Cannot generate image: AI service not ready or no image prompt available.';
                imageGenerationStatus.className = 'error';
                if (!ai) await requestApiKeyFromUser();
                return;
            }

            let geminiImageResponse: GenerateImagesResponse | null = null; 

            generateImageButton.disabled = true;
            generateImageButton.textContent = 'Generating Image...';
            imageGenerationStatus.textContent = 'Generating image... Please wait.';
            imageGenerationStatus.className = 'loading';
            if (generatedImageDisplay) generatedImageDisplay.style.display = 'none';
            if (generatedImageElement) generatedImageElement.src = '#';
            if (imageActions) imageActions.style.display = 'none';
            if (imageActionStatus) {
                imageActionStatus.textContent = '';
                imageActionStatus.className = '';
            }

            try {
                geminiImageResponse = await ai.models.generateImages({
                    model: 'imagen-3.0-generate-002',
                    prompt: currentImagePrompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/png' },
                });
                
                if (geminiImageResponse?.generatedImages?.[0]?.image?.imageBytes) {
                    const base64ImageBytes = geminiImageResponse.generatedImages[0].image.imageBytes;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`; 
                    
                    if (generatedImageElement) generatedImageElement.src = imageUrl;
                    if (generatedImageDisplay) generatedImageDisplay.style.display = 'block';
                    if (imageActions) imageActions.style.display = 'flex';
                    imageGenerationStatus.textContent = 'Image generated successfully!';
                    imageGenerationStatus.className = 'success';
                } else {
                    // If imageBytes is not present, it implies filtering or an issue with this specific image.
                    // The SDK types (as per TS error) don't provide a specific error object at generatedImages[0].error.
                    console.warn("Image generation: generatedImages[0].image.imageBytes was missing. Full response:", geminiImageResponse);
                    throw new Error('No image data received from API. The image might have been filtered or an unknown error occurred with this specific image generation.');
                }
            } catch (error) {
                console.error('Error generating image:', error);
                // Default error message, will be overridden by more specific checks below
                imageGenerationStatus.textContent = 'Error generating image. Please try again.';
                imageGenerationStatus.className = 'error';

                 if (error instanceof Error) {
                    if (error.message.includes("API key not valid") || error.message.toLowerCase().includes("api_key_invalid") || error.message.includes("permission denied")) {
                        imageGenerationStatus.textContent = 'Error: API Key is invalid for image generation. Please provide a valid key.';
                        ai = null;
                        sessionStorage.removeItem('userProvidedApiKey');
                        await requestApiKeyFromUser();
                    } else if (error.message.includes("quota")) {
                        imageGenerationStatus.textContent = 'Error: Image generation API quota exceeded.';
                    } else if (error.message.toLowerCase().includes("filter") || error.message.toLowerCase().includes("safety policies") || error.message.toLowerCase().includes("prompt was blocked")) {
                        // The error.message itself is the most detailed information we have.
                        imageGenerationStatus.textContent = `Error: Image generation failed, possibly due to safety policies or filtering. Details: ${error.message}`;
                    } else {
                        // For other errors not specifically handled above, display their message.
                        imageGenerationStatus.textContent = `Error generating image: ${error.message}. Please try again.`;
                    }
                } else {
                    // Non-Error object thrown
                    imageGenerationStatus.textContent = 'An unexpected error occurred during image generation.';
                }
            } finally {
                generateImageButton.disabled = false; // Will be re-evaluated
                generateImageButton.textContent = 'Generate Image';
                updateAllButtonStates();
                 setTimeout(() => {
                    if (imageGenerationStatus.className !== 'error' && imageGenerationStatus.className !== 'info') {
                         imageGenerationStatus.textContent = '';
                         imageGenerationStatus.className = '';
                    }
                }, 7000);
            }
        });
    }

    if (downloadImageButton && generatedImageElement && imageActionStatus) {
        downloadImageButton.addEventListener('click', () => {
            const imageUrl = generatedImageElement.src;
            if (!imageUrl || imageUrl === '#' || !imageUrl.startsWith('data:image')) {
                imageActionStatus.textContent = 'No image to download.';
                imageActionStatus.className = 'error';
                setTimeout(() => { imageActionStatus.textContent = ''; imageActionStatus.className = ''; }, 3000);
                return;
            }
            downloadImageButton.disabled = true;
            downloadImageButton.textContent = 'Downloading...';
            try {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `linkedin-ai-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                imageActionStatus.textContent = 'Image download started!';
                imageActionStatus.className = 'success';
            } catch (error) {
                console.error('Error downloading image:', error);
                imageActionStatus.textContent = 'Download failed.';
                imageActionStatus.className = 'error';
            } finally {
                setTimeout(() => {
                    downloadImageButton.disabled = false;
                    downloadImageButton.textContent = 'Download Image';
                    if (imageActionStatus.className !== 'error') {
                         imageActionStatus.textContent = '';
                         imageActionStatus.className = '';
                    }
                     updateAllButtonStates();
                }, 3000);
            }
        });
    }

    if (copyImageButton && generatedImageElement && imageActionStatus) {
        copyImageButton.addEventListener('click', async () => {
            const imageUrl = generatedImageElement.src;
             if (!imageUrl || imageUrl === '#' || !imageUrl.startsWith('data:image')) {
                imageActionStatus.textContent = 'No image to copy.';
                imageActionStatus.className = 'error';
                setTimeout(() => { imageActionStatus.textContent = ''; imageActionStatus.className = ''; }, 3000);
                return;
            }
            if (!navigator.clipboard?.write) {
                imageActionStatus.textContent = 'Clipboard API (write) not supported or permission denied.';
                imageActionStatus.className = 'error';
                console.warn('Clipboard API (write) not available.');
                setTimeout(() => { imageActionStatus.textContent = ''; imageActionStatus.className = ''; }, 3000);
                return;
            }

            copyImageButton.disabled = true;
            copyImageButton.textContent = 'Copying...';
            try {
                const fetchResponse = await fetch(imageUrl); 
                const blob = await fetchResponse.blob();
                const item = new ClipboardItem({ [blob.type]: blob }); 
                await navigator.clipboard.write([item]);
                imageActionStatus.textContent = 'Image copied to clipboard!';
                imageActionStatus.className = 'success';
            } catch (error) {
                console.error('Error copying image:', error);
                imageActionStatus.textContent = 'Copy failed. See console for details.';
                imageActionStatus.className = 'error';
                if (error instanceof TypeError && error.message.toLowerCase().includes("type") && error.message.toLowerCase().includes("not supported")) {
                    imageActionStatus.textContent = `Copy failed: Image type might not be supported by clipboard. Try downloading.`;
                } else if (error instanceof DOMException && error.name === 'NotAllowedError') {
                     imageActionStatus.textContent = 'Copy failed: Clipboard permission denied.';
                }
            } finally {
                 setTimeout(() => {
                    copyImageButton.disabled = false;
                    copyImageButton.textContent = 'Copy Image';
                    if (imageActionStatus.className !== 'error') {
                        imageActionStatus.textContent = '';
                        imageActionStatus.className = '';
                    }
                     updateAllButtonStates();
                }, 3000);
            }
        });
    }
    updateAllButtonStates(); // Final call to ensure correct initial button states
});
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
// Use newer stable flash model for better structured outputs
const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const geminiService = {
    // Helper: retry an async operation with exponential backoff on retryable errors (429, rate limit, quota)
    async retryWithBackoff(operation, { retries = 4, baseDelay = 500 } = {}) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (err) {
                const msg = (err && (err.message || JSON.stringify(err))) || '';
                const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate-limit') || msg.toLowerCase().includes('embed_content_free_tier_requests');
                if (!isRateLimit || attempt === retries) {
                    throw err;
                }
                // Exponential backoff with jitter
                const delay = Math.round(baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5));
                console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    },
    async getEmbedding(text) {
        if (!config.geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your .env and restart the server.');
        }
        try {
            const op = async () => {
                const result = await embeddingModel.embedContent(text);
                return result.embedding.values;
            };
            return await this.retryWithBackoff(op, { retries: 5, baseDelay: 400 });
        } catch (error) {
            console.error('Error generating embedding:', error);
            // Map common API errors to actionable messages
            const msg = (error && (error.message || JSON.stringify(error))) || '';
            if (msg.includes('403') || msg.includes('Forbidden')) {
                throw new Error('Google Generative API returned 403 Forbidden. The API key may be invalid or revoked. Rotate the key and update GEMINI_API_KEY.');
            }
            if (msg.includes('API_KEY_INVALID') || /api key expired/i.test(msg) || /expired/i.test(msg)) {
                throw new Error('Google Generative API returned API_KEY_INVALID / expired. Please renew your API key in Google Cloud Console, update GEMINI_API_KEY in your .env, and restart the server.');
            }
            throw error;
        }
    },

    async generateContent(input) {
        try {
            // Wrap generation in retry/backoff for transient rate limits
            const op = async () => {
                // Input can be a string prompt or an array/parts (for multi-part content)
                const result = await generativeModel.generateContent(input);
                const response = await result.response;
                return response.text();
            };
            return await this.retryWithBackoff(op, { retries: 4, baseDelay: 500 });
        } catch (error) {
            console.error('Error generating content:', error);
            const msg = (error && (error.message || JSON.stringify(error))) || '';
            if (msg.includes('API_KEY_INVALID') || /api key expired/i.test(msg) || /expired/i.test(msg)) {
                throw new Error('Google Generative API returned API_KEY_INVALID / expired. Please renew your API key in Google Cloud Console, update GEMINI_API_KEY in your .env, and restart the server.');
            }
            if (msg.includes('429') || msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('quota')) {
                throw new Error('Google Generative API rate limit reached (429). Consider enabling billing, requesting higher quota, or reducing request volume. See README_ENV.md for steps.');
            }
            throw error;
        }
    },

    async generateJson(prompt) {
        try {
            const jsonPrompt = `${prompt} \n\nRespond strictly with valid JSON only. Do not include explanatory text or markdown fences.`;
            const text = await this.generateContent(jsonPrompt);

            // Remove common markdown code fences
            let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Attempt to extract the first balanced JSON object/array from the output
            const extractJSON = (s) => {
                const startIdx = s.search(/[\[{]/);
                if (startIdx === -1) return null;
                const openChar = s[startIdx];
                const closeChar = openChar === '{' ? '}' : ']';

                let depth = 0;
                let inString = false;
                let escape = false;
                for (let i = startIdx; i < s.length; i++) {
                    const ch = s[i];
                    if (inString) {
                        if (escape) {
                            escape = false;
                        } else if (ch === '\\') {
                            escape = true;
                        } else if (ch === '"') {
                            inString = false;
                        }
                    } else {
                        if (ch === '"') {
                            inString = true;
                        } else if (ch === openChar) {
                            depth += 1;
                        } else if (ch === closeChar) {
                            depth -= 1;
                            if (depth === 0) {
                                return s.slice(startIdx, i + 1);
                            }
                        }
                    }
                }
                return null;
            };

            const jsonSubstring = extractJSON(cleaned) || cleaned;

            try {
                return JSON.parse(jsonSubstring);
            } catch (err) {
                console.error('Failed to parse JSON from model output. Raw output follows.');
                console.error('Model raw output:', text);
                console.error('Attempted cleaned substring:', jsonSubstring);
                throw new Error('Model did not return valid JSON');
            }
        } catch (error) {
            console.error('Error generating JSON:', error);
            throw error;
        }
    }
};

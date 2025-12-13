import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
// Use newer stable flash model for better structured outputs
const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const geminiService = {
    async getEmbedding(text) {
        if (!config.geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your .env and restart the server.');
        }
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            // Re-throw with a clearer, actionable message for common 403 cases
            if (error && error.message && error.message.includes('403')) {
                throw new Error('Google Generative API returned 403 Forbidden. The API key may be invalid or revoked. Rotate the key and update GEMINI_API_KEY.');
            }
            throw error;
        }
    },

    async generateContent(input) {
        try {
            // Input can be a string prompt or an array/parts (for multi-part content)
            const result = await generativeModel.generateContent(input);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating content:', error);
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
